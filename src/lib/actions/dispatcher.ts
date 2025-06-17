'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { geocodeAddress } from '@/lib/google-maps'
import { validateContainerNumber } from '@/lib/utils'
import type { ImportContainer, ExportBooking, Organization, CreateImportContainerForm, CreateExportBookingForm } from '@/lib/types'

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
      shipping_line:organizations!import_containers_shipping_line_org_id_fkey(*)
    `)
    .eq('trucking_company_org_id', orgId)
    .order('created_at', { ascending: false })

  if (containersError) {
    console.error('Error fetching containers:', containersError)
    throw containersError
  }

  // Get export bookings
  const { data: exportBookings, error: bookingsError } = await supabase
    .from('export_bookings')
    .select('*')
    .eq('trucking_company_org_id', orgId)
    .order('created_at', { ascending: false })

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    throw bookingsError
  }

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
    .eq('requesting_org_id', orgId)
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
    console.log('Starting addImportContainer with data:', JSON.stringify(data, null, 2))
    
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No authenticated user found')
      throw new Error('Unauthorized: User not authenticated')
    }
    console.log('Authenticated user:', user.id)

    // Get user profile to get organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      console.error('No organization found for user:', user.id)
      throw new Error('User organization not found')
    }
    console.log('User organization:', profile.organization_id)

    // Validate container number
    if (!validateContainerNumber(data.container_number)) {
      console.error('Invalid container number:', data.container_number)
      throw new Error('Invalid container number format')
    }
    console.log('Container number validation passed:', data.container_number)

    // Check if container already exists
    const { data: existingContainer } = await supabase
      .from('import_containers')
      .select('container_number')
      .eq('container_number', data.container_number)
      .single()

    if (existingContainer) {
      console.error('Container already exists:', data.container_number)
      throw new Error(`Container ${data.container_number} already exists`)
    }
    console.log('Container uniqueness check passed')

    // Validate cargo type exists
    const { data: cargoType, error: cargoError } = await supabase
      .from('cargo_types')
      .select('id')
      .eq('id', data.cargo_type_id)
      .single()

    if (cargoError || !cargoType) {
      console.error('Cargo type validation failed:', cargoError, data.cargo_type_id)
      throw new Error('Invalid cargo type')
    }
    console.log('Cargo type validation passed:', data.cargo_type_id)

    // Get depot details for coordinates and location name
    const { data: depot, error: depotError } = await supabase
      .from('depots')
      .select('latitude, longitude, name, address')
      .eq('id', data.depot_id)
      .single()

    console.log('Depot lookup result:', { depot, depotError })

    // Get container type details
    const { data: containerType, error: containerTypeError } = await supabase
      .from('container_types')
      .select('code')
      .eq('id', data.container_type_id)
      .single()

    if (containerTypeError || !containerType) {
      console.error('Container type validation failed:', containerTypeError, data.container_type_id)
      throw new Error('Invalid container type')
    }
    console.log('Container type validation passed:', data.container_type_id, containerType.code)

    // Prepare insert data
    const insertData = {
      container_number: data.container_number,
      container_type: containerType.code, // Keep legacy field for compatibility
      container_type_id: data.container_type_id,
      cargo_type_id: data.cargo_type_id,
      city_id: data.city_id,
      depot_id: data.depot_id,
      drop_off_location: depot?.address || `${depot?.name || 'Depot'}`, // Required legacy field
      available_from_datetime: data.available_from_datetime,
      trucking_company_org_id: profile.organization_id, // Use organization_id instead of user.id
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
    console.error('Error stack:', error.stack)
    
    // Return a user-friendly error message
    const errorMessage = error.message?.includes('already exists') 
      ? error.message
      : error.message?.includes('Invalid') 
      ? error.message
      : error.message?.includes('Database error') 
      ? error.message
      : 'Có lỗi xảy ra khi tạo lệnh giao trả. Vui lòng thử lại.'
    
    throw new Error(errorMessage)
  }
}

// Add export booking - SERVER ACTION
export async function addExportBooking(data: CreateExportBookingForm) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Get user profile to get organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      throw new Error('User organization not found')
    }

    // Validate cargo type exists
    const { data: cargoType } = await supabase
      .from('cargo_types')
      .select('id')
      .eq('id', data.cargo_type_id)
      .single()

    if (!cargoType) {
      throw new Error('Invalid cargo type')
    }

    // Get depot details for location name
    const { data: depot } = await supabase
      .from('depots')
      .select('name, address')
      .eq('id', data.depot_id)
      .single()

    // Get container type details
    const { data: containerType } = await supabase
      .from('container_types')
      .select('code')
      .eq('id', data.container_type_id)
      .single()

    if (!containerType) {
      throw new Error('Invalid container type')
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
        pick_up_location: depot?.address || `${depot?.name || 'Depot'}`, // Required legacy field
        needed_by_datetime: data.needed_by_datetime,
        trucking_company_org_id: profile.organization_id, // Use organization_id instead of user.id
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
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  // Get container to find approving organization
  const { data: container } = await supabase
    .from('import_containers')
    .select('shipping_line_org_id')
    .eq('id', importContainerId)
    .single()

  if (!container) {
    throw new Error('Container not found')
  }

  // Create the request
  const { error: requestError } = await supabase
    .from('street_turn_requests')
    .insert({
      import_container_id: importContainerId,
      export_booking_id: exportBookingId,
      requesting_org_id: user.profile.organization_id,
      approving_org_id: container.shipping_line_org_id,
      status: 'PENDING',
      estimated_cost_saving: estimatedCostSaving,
      estimated_co2_saving_kg: estimatedCo2Saving
    })

  if (requestError) {
    console.error('Error creating request:', requestError)
    throw requestError
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

  if (containerError || bookingError) {
    console.error('Error updating status:', { containerError, bookingError })
  }

  revalidatePath('/dispatcher')
} 