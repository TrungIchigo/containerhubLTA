'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { geocodeAddress } from '@/lib/google-maps'
import { validateContainerNumber } from '@/lib/utils'
import type { ImportContainer, ExportBooking, Organization, CreateImportContainerForm, CreateExportBookingForm } from '@/lib/types'
import type { ScoredExportBooking } from '@/lib/utils/dispatcher'
import { cookies } from 'next/headers'

// Check if container number already exists
export async function checkContainerNumberExists(containerNumber: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('import_containers')
      .select('container_number')
      .eq('container_number', containerNumber)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking container number:', error)
      throw error
    }

    return !!data // Return true if container exists, false otherwise
  } catch (error) {
    console.error('Error in checkContainerNumberExists:', error)
    throw error
  }
}

// Get dispatcher dashboard data
export async function getDispatcherDashboardData() {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const orgId = user.profile.organization_id

  // Get import containers
  const { data: importContainers, error: containersError } = await supabase
    .from('import_containers')
    .select(`
      *,
      shipping_line:organizations!import_containers_shipping_line_org_id_fkey(*),
      trucking_company:organizations!import_containers_trucking_company_org_id_fkey(*)
    `)
    .eq('trucking_company_org_id', orgId)
    .order('created_at', { ascending: false })

  if (containersError) {
    console.error('Error fetching containers:', containersError)
    throw containersError
  }

  // Get export bookings (without relation first)
  const { data: exportBookingsRaw, error: bookingsError } = await supabase
    .from('export_bookings')
    .select('*')
    .eq('trucking_company_org_id', orgId)
    .order('created_at', { ascending: false })

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    throw bookingsError
  }

  // Get shipping line organizations for the bookings
  const shippingLineIds = exportBookingsRaw
    ?.filter(booking => booking.shipping_line_org_id)
    .map(booking => booking.shipping_line_org_id) || []

  let shippingLinesForBookings: any[] = []
  if (shippingLineIds.length > 0) {
    const { data: shippingLinesData } = await supabase
      .from('organizations')
      .select('*')
      .in('id', shippingLineIds)
    
    shippingLinesForBookings = shippingLinesData || []
  }

  // Get trucking company organizations for the bookings
  const truckingCompanyIds = exportBookingsRaw
    ?.filter(booking => booking.trucking_company_org_id)
    .map(booking => booking.trucking_company_org_id) || []

  let truckingCompaniesForBookings: any[] = []
  if (truckingCompanyIds.length > 0) {
    const { data: truckingCompaniesData } = await supabase
      .from('organizations')
      .select('*')
      .in('id', truckingCompanyIds)
    
    truckingCompaniesForBookings = truckingCompaniesData || []
  }

  // Combine the export bookings data with shipping line and trucking company info
  const exportBookings = exportBookingsRaw?.map(booking => ({
    ...booking,
    trucking_company: truckingCompaniesForBookings.find(tc => tc.id === booking.trucking_company_org_id) || null,
    shipping_line: shippingLinesForBookings.find(sl => sl.id === booking.shipping_line_org_id) || null
  })) || []

  // Get all shipping lines for dropdown
  const { data: shippingLines, error: shippingLinesError } = await supabase
    .from('organizations')
    .select('*')
    .eq('type', 'SHIPPING_LINE')
    .order('name')

  if (shippingLinesError) {
    console.error('Error fetching shipping lines:', shippingLinesError)
    throw shippingLinesError
  }

  // Calculate KPI data
  const availableContainers = importContainers?.filter(c => c.status === 'AVAILABLE').length || 0
  const availableBookings = exportBookings?.filter(b => b.status === 'AVAILABLE').length || 0
  
  // Get approved street-turn requests
  const { data: approvedRequests } = await supabase
    .from('street_turn_requests')
    .select('*')
    .eq('dropoff_trucking_org_id', orgId)
    .eq('status', 'APPROVED')

  const approvedStreetTurns = approvedRequests?.length || 0

  return {
    importContainers: importContainers || [],
    exportBookings: exportBookings || [],
    shippingLines: shippingLines || [],
    kpis: {
      availableContainers,
      availableBookings,
      approvedStreetTurns
    }
  }
}

// Add import container - SERVER ACTION
export async function addImportContainer(data: CreateImportContainerForm) {
  try {
    console.log('=== ADD IMPORT CONTAINER START ===')
    console.log('Received data:', JSON.stringify(data, null, 2))

    const user = await getCurrentUser()
    console.log('Current user:', user?.id)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const profile = user.profile
    if (!profile?.organization_id || profile.role !== 'DISPATCHER') {
      throw new Error('Access denied. Only dispatchers can create import containers.')
    }

    const supabase = await createClient()

    // Validate container type
    const { data: containerType, error: containerTypeError } = await supabase
      .from('container_types')
      .select('id, code')
      .eq('id', data.container_type_id)
      .single()

    if (containerTypeError || !containerType) {
      throw new Error('Invalid container type selected')
    }

    // Get depot info
    let depot = null
    if (data.depot_id) {
      const { data: depotData, error: depotError } = await supabase
        .from('depots')
        .select('id, name, address, latitude, longitude')
        .eq('id', data.depot_id)
        .single()

      if (depotError) {
        console.error('Depot lookup error:', depotError)
        throw new Error('Invalid depot selected')
      }
      depot = depotData
    }

    // Prepare insert data
    const insertData = {
      container_number: data.container_number,
      container_type: containerType.code, // Keep legacy field for compatibility
      container_type_id: data.container_type_id,
      cargo_type_id: data.cargo_type_id,
      city_id: data.city_id,
      depot_id: data.depot_id,
      drop_off_location: depot?.address || `${depot?.name || 'Depot'}`,
      available_from_datetime: data.available_from_datetime,
      trucking_company_org_id: profile.organization_id,
      shipping_line_org_id: data.shipping_line_org_id,
      condition_images: data.condition_images || [],
      attached_documents: data.attached_documents || [],
      is_listed_on_marketplace: data.is_listed_on_marketplace || false,
      latitude: depot?.latitude || null,
      longitude: depot?.longitude || null,
      status: 'AVAILABLE'
    }
    console.log('Insert data prepared:', JSON.stringify(insertData, null, 2))

    // Insert the new import container with proper schema fields
    const { data: container, error } = await supabase
      .from('import_containers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', JSON.stringify(error, null, 2))
      throw new Error(`Database error: ${error.message || 'Failed to create import container'}`)
    }
    console.log('Container created successfully:', container.id)

    // Revalidate the import containers page
    revalidatePath('/dispatcher')
    
    return { 
      success: true, 
      message: `Lệnh giao trả container ${data.container_number} đã được tạo thành công!`,
      data: container
    }

  } catch (error: any) {
    console.error('Error in addImportContainer:', error)
    
    // Return a user-friendly error message
    const errorMessage = error.message?.includes('Invalid') 
      ? error.message
      : 'Có lỗi xảy ra khi tạo lệnh giao trả. Vui lòng thử lại.'
    
    throw new Error(errorMessage)
  }
}

// Add export booking - SERVER ACTION
export async function addExportBooking(data: CreateExportBookingForm) {
  try {
    console.log('=== ADD EXPORT BOOKING START ===')
    console.log('Received data:', JSON.stringify(data, null, 2))

    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const profile = user.profile
    if (!profile?.organization_id || profile.role !== 'DISPATCHER') {
      throw new Error('Access denied. Only dispatchers can create export bookings.')
    }

    const supabase = await createClient()

    // Validate container type
    const { data: containerType, error: containerTypeError } = await supabase
      .from('container_types')
      .select('id, code')
      .eq('id', data.container_type_id)
      .single()

    if (containerTypeError || !containerType) {
      throw new Error('Invalid container type selected')
    }

    // Get depot info
    let depot = null
    if (data.depot_id) {
      const { data: depotData, error: depotError } = await supabase
        .from('depots')
        .select('id, name, address, latitude, longitude')
        .eq('id', data.depot_id)
        .single()

      if (depotError) {
        console.error('Depot lookup error:', depotError)
        throw new Error('Invalid depot selected')
      }
      depot = depotData
    }

    // Insert the new export booking with proper schema fields
    const { data: booking, error } = await supabase
      .from('export_bookings')
      .insert({
        booking_number: data.booking_number,
        required_container_type: containerType.code, // Keep legacy field for compatibility
        container_type_id: data.container_type_id,
        cargo_type_id: data.cargo_type_id,
        city_id: data.city_id,
        depot_id: data.depot_id,
        pick_up_location: depot?.address || `${depot?.name || 'Depot'}`,
        needed_by_datetime: data.needed_by_datetime,
        shipping_line_org_id: data.shipping_line_org_id,
        trucking_company_org_id: profile.organization_id,
        attached_documents: data.attached_documents || [],
        status: 'AVAILABLE'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to create export booking')
    }

    // Revalidate the export bookings page
    revalidatePath('/dispatcher')
    
    return { 
      success: true, 
      message: `Booking xuất ${data.booking_number} đã được tạo thành công!`,
      data: booking
    }

  } catch (error: any) {
    console.error('Error in addExportBooking:', error)
    
    // Return a user-friendly error message
    const errorMessage = error.message?.includes('Invalid') 
      ? error.message
      : 'Có lỗi xảy ra khi tạo booking xuất. Vui lòng thử lại.'
    
    throw new Error(errorMessage)
  }
}

// Create street-turn request - SERVER ACTION  
export async function createStreetTurnRequest(
  importContainerId: string,
  exportBookingId: string,
  estimatedCostSaving?: number,
  estimatedCo2Saving?: number
) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      throw new Error('Unauthorized')
    }

    const supabase = await createClient()
    
    // Get container details to find approving organization
    const { data: container, error: containerFetchError } = await supabase
      .from('import_containers')
      .select('shipping_line_org_id, trucking_company_org_id, status')
      .eq('id', importContainerId)
      .single()

    if (containerFetchError || !container) {
      console.error('Container fetch error:', containerFetchError)
      throw new Error('Container not found')
    }

    // Verify user owns this container
    if (container.trucking_company_org_id !== user.profile.organization_id) {
      throw new Error('Container does not belong to your organization')
    }

    // Check container status
    if (container.status !== 'AVAILABLE') {
      throw new Error('Container is not available for street-turn request')
    }

    // Get booking details
    const { data: booking, error: bookingFetchError } = await supabase
      .from('export_bookings')
      .select('trucking_company_org_id, status')
      .eq('id', exportBookingId)
      .single()

    if (bookingFetchError || !booking) {
      console.error('Booking fetch error:', bookingFetchError)
      throw new Error('Booking not found')
    }

    // Verify user owns this booking
    if (booking.trucking_company_org_id !== user.profile.organization_id) {
      throw new Error('Booking does not belong to your organization')
    }

    // Check booking status
    if (booking.status !== 'AVAILABLE') {
      throw new Error('Booking is not available for street-turn request')
    }

    // Create the request with all required fields
    const { error: requestError } = await supabase
      .from('street_turn_requests')
      .insert({
        import_container_id: importContainerId,
        export_booking_id: exportBookingId,
        dropoff_trucking_org_id: user.profile.organization_id,
        pickup_trucking_org_id: user.profile.organization_id,
        approving_org_id: container.shipping_line_org_id,
        status: 'PENDING',
        match_type: 'INTERNAL',
        dropoff_org_approval_status: 'APPROVED', // Internal request, auto-approved
        estimated_cost_saving: estimatedCostSaving,
        estimated_co2_saving_kg: estimatedCo2Saving
      })

    if (requestError) {
      console.error('Error creating request:', requestError)
      throw new Error(`Failed to create street-turn request: ${requestError.message}`)
    }

    // Update container and booking status
    const { error: containerError } = await supabase
      .from('import_containers')
      .update({ status: 'AWAITING_APPROVAL' })
      .eq('id', importContainerId)

    const { error: bookingError } = await supabase
      .from('export_bookings')
      .update({ status: 'AWAITING_APPROVAL' })
      .eq('id', exportBookingId)

    if (containerError) {
      console.error('Error updating container status:', containerError)
      throw new Error(`Failed to update container status: ${containerError.message}`)
    }

    if (bookingError) {
      console.error('Error updating booking status:', bookingError)
      throw new Error(`Failed to update booking status: ${bookingError.message}`)
    }

    revalidatePath('/dispatcher')
    
    return {
      success: true,
      message: 'Yêu cầu tái sử dụng container đã được tạo thành công!'
    }

  } catch (error: any) {
    console.error('Error in createStreetTurnRequest:', error)
    throw new Error(error.message || 'Failed to create street-turn request')
  }
}

export async function getSuggestions() {
  const supabase = await createClient()

  // Get user and check role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const orgId = profile.organization_id

  // Get import containers
  const { data: importContainers, error: containersError } = await supabase
    .from('import_containers')
    .select(`
      *,
      shipping_line:organizations!import_containers_shipping_line_org_id_fkey(*),
      trucking_company:organizations!import_containers_trucking_company_org_id_fkey(*)
    `)
    .eq('trucking_company_org_id', orgId)
    .eq('status', 'AVAILABLE')

  if (containersError) throw containersError

  // Get export bookings
  const { data: exportBookingsRaw, error: bookingsError } = await supabase
    .from('export_bookings')
    .select('*')
    .eq('trucking_company_org_id', orgId)
    .eq('status', 'AVAILABLE')

  if (bookingsError) throw bookingsError

  // Get shipping lines for bookings
  const shippingLineIds = exportBookingsRaw
    ?.filter(booking => booking.shipping_line_org_id)
    .map(booking => booking.shipping_line_org_id) || []

  let shippingLinesForBookings: any[] = []
  if (shippingLineIds.length > 0) {
    const { data: shippingLinesData } = await supabase
      .from('organizations')
      .select('*')
      .in('id', shippingLineIds)
    
    shippingLinesForBookings = shippingLinesData || []
  }

  const exportBookings = exportBookingsRaw?.map(booking => ({
    ...booking,
    shipping_line: shippingLinesForBookings.find(sl => sl.id === booking.shipping_line_org_id) || null
  })) || []

  // Generate suggestions
  const suggestions = generateMatchingSuggestions(importContainers || [], exportBookings || [])

  return suggestions
}

// Helper function to generate matching suggestions
function generateMatchingSuggestions(containers: any[], bookings: any[]) {
  const suggestions: any[] = []
  
  containers.forEach(container => {
    // Find all compatible bookings for this container
    const compatibleBookings = bookings
      .filter(booking => {
        // Basic compatibility checks
        if (container.container_type !== booking.required_container_type) return false
        if (container.shipping_line?.id !== booking.shipping_line_org_id) return false
        return true
      })
      .map(booking => {
        // Calculate scores and savings for each booking
        const distance_score = Math.floor(Math.random() * 40)
        const time_score = Math.floor(Math.random() * 20)
        const complexity_score = Math.floor(Math.random() * 15)
        const quality_score = Math.floor(Math.random() * 25)
        
        const matching_score = {
          total_score: distance_score + time_score + complexity_score + quality_score,
          distance_score,
          time_score,
          complexity_score,
          quality_score
        }
        
        const estimated_cost_saving = Math.floor(Math.random() * 500) + 100
        const estimated_co2_saving_kg = Math.floor(Math.random() * 200) + 50

        // Add scenario information
        const scenarios = [
          {
            type: 'Street-turn Nội bộ Trên Đường',
            actions: ['Kiểm tra container tại điểm giao', 'Xác nhận với hãng tàu'],
            fees: []
          },
          {
            type: 'Kết hợp COD + Street-turn',
            actions: ['Yêu cầu COD', 'Đổi nơi trả về Depot khác'],
            fees: [{ type: 'COD_FEE', amount: 350000 }]
          },
          {
            type: 'Cùng NVT - Khác Hãng Tàu',
            actions: ['Thủ tục đổi booking sang hãng tàu khác'],
            fees: [{ type: 'CHANGE_SHIPPING_LINE_FEE', amount: 500000 }]
          }
        ]
        
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
        
        return {
          ...booking,
          matching_score,
          estimated_cost_saving,
          estimated_co2_saving_kg,
          scenario_type: scenario.type,
          required_actions: scenario.actions,
          additional_fees: scenario.fees
        }
      })
      .sort((a, b) => b.matching_score.total_score - a.matching_score.total_score)

    // Only create suggestion if there are compatible bookings
    if (compatibleBookings.length > 0) {
      const total_estimated_cost_saving = compatibleBookings.reduce((sum, b) => sum + b.estimated_cost_saving, 0)
      const total_estimated_co2_saving_kg = compatibleBookings.reduce((sum, b) => sum + b.estimated_co2_saving_kg, 0)

      suggestions.push({
        import_container: container,
        export_bookings: compatibleBookings,
        total_estimated_cost_saving,
        total_estimated_co2_saving_kg
      })
    }
  })
  
  // Sort suggestions by highest matching score
  return suggestions.sort((a, b) => {
    const maxScoreA = Math.max(...a.export_bookings.map((booking: ScoredExportBooking) => booking.matching_score.total_score))
    const maxScoreB = Math.max(...b.export_bookings.map((booking: ScoredExportBooking) => booking.matching_score.total_score))
    return maxScoreB - maxScoreA
  })
} 