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
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Validate container number
    if (!validateContainerNumber(data.container_number)) {
      throw new Error('Invalid container number format')
    }

    // Check if container already exists
    const { data: existingContainer } = await supabase
      .from('import_containers')
      .select('container_number')
      .eq('container_number', data.container_number)
      .single()

    if (existingContainer) {
      throw new Error(`Container ${data.container_number} already exists`)
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

    // Get depot details for coordinates
    const { data: depot } = await supabase
      .from('depots')
      .select('latitude, longitude')
      .eq('id', data.depot_id)
      .single()

    // Insert the new import container with image and document URLs
    const { data: container, error } = await supabase
      .from('import_containers')
      .insert({
        container_number: data.container_number,
        container_type: data.container_type,
        cargo_type_id: data.cargo_type_id,
        city_id: data.city_id,
        depot_id: data.depot_id,
        available_from_datetime: data.available_from_datetime,
        shipping_line_org_id: data.shipping_line_org_id,
        condition_images: data.condition_images || [],
        attached_documents: data.attached_documents || [],
        is_listed_on_marketplace: data.is_listed_on_marketplace || false,
        latitude: depot?.latitude || data.latitude,
        longitude: depot?.longitude || data.longitude,
        dispatcher_user_id: user.id,
        status: 'available'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to create import container')
    }

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
    const errorMessage = error.message?.includes('already exists') 
      ? error.message
      : error.message?.includes('Invalid') 
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

    // Validate cargo type exists
    const { data: cargoType } = await supabase
      .from('cargo_types')
      .select('id')
      .eq('id', data.cargo_type_id)
      .single()

    if (!cargoType) {
      throw new Error('Invalid cargo type')
    }

    // Insert the new export booking with document URLs
    const { data: booking, error } = await supabase
      .from('export_bookings')
      .insert({
        booking_number: data.booking_number,
        required_container_type: data.required_container_type,
        cargo_type_id: data.cargo_type_id,
        city_id: data.city_id,
        depot_id: data.depot_id,
        needed_by_datetime: data.needed_by_datetime,
        attached_documents: data.attached_documents || [],
        dispatcher_user_id: user.id,
        status: 'pending'
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