'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { geocodeAddress } from '@/lib/google-maps'
import type { ImportContainer, ExportBooking, Organization } from '@/lib/types'

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
export async function addImportContainer(formData: {
  container_number: string
  container_type: string
  drop_off_location: string
  available_from_datetime: string
  shipping_line_org_id: string
  is_listed_on_marketplace?: boolean
  latitude?: number
  longitude?: number
}) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  // Geocode the address if coordinates are not provided
  let latitude = formData.latitude
  let longitude = formData.longitude
  
  if (!latitude || !longitude) {
    const coordinates = await geocodeAddress(formData.drop_off_location)
    if (coordinates) {
      latitude = coordinates.lat
      longitude = coordinates.lng
    }
  }
  
  const { error } = await supabase
    .from('import_containers')
    .insert({
      container_number: formData.container_number,
      container_type: formData.container_type,
      drop_off_location: formData.drop_off_location,
      available_from_datetime: formData.available_from_datetime,
      trucking_company_org_id: user.profile.organization_id,
      shipping_line_org_id: formData.shipping_line_org_id,
      is_listed_on_marketplace: formData.is_listed_on_marketplace || false,
      latitude,
      longitude,
      status: 'AVAILABLE'
    })

  if (error) {
    console.error('Error adding container:', error)
    throw error
  }

  revalidatePath('/dispatcher')
}

// Add export booking - SERVER ACTION
export async function addExportBooking(formData: {
  booking_number: string
  required_container_type: string
  pick_up_location: string
  needed_by_datetime: string
}) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('export_bookings')
    .insert({
      booking_number: formData.booking_number,
      required_container_type: formData.required_container_type,
      pick_up_location: formData.pick_up_location,
      needed_by_datetime: formData.needed_by_datetime,
      trucking_company_org_id: user.profile.organization_id,
      status: 'AVAILABLE'
    })

  if (error) {
    console.error('Error adding booking:', error)
    throw error
  }

  revalidatePath('/dispatcher')
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