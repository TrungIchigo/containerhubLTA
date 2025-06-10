import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface StreetTurnRequestFilters {
  search?: string
  status?: 'PENDING' | 'APPROVED' | 'DECLINED'
}

export async function getStreetTurnRequests(filters: StreetTurnRequestFilters = {}) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile error:', profileError)
    throw new Error('Profile not found')
  }

  if (profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized access')
  }

  // Query actual street turn requests from database
  let query = supabase
    .from('street_turn_requests')
    .select(`
      *,
      import_container:import_containers(
        container_number,
        container_type,
        drop_off_location,
        available_from_datetime
      ),
      export_booking:export_bookings(
        booking_number,
        required_container_type,
        pick_up_location,
        needed_by_datetime
      ),
      approving_org:organizations!street_turn_requests_approving_org_id_fkey(
        name
      )
    `)
    .eq('requesting_org_id', profile.organization_id)
    .order('created_at', { ascending: false })

  // Apply status filter
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data: requests, error: requestsError } = await query

  if (requestsError) {
    console.error('Error fetching requests:', requestsError)
    throw new Error('Failed to fetch requests')
  }

  let filteredRequests = requests || []

  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredRequests = filteredRequests.filter(request => {
      const containerNumber = request.import_container?.container_number?.toLowerCase() || ''
      const bookingNumber = request.export_booking?.booking_number?.toLowerCase() || ''
      return containerNumber.includes(searchTerm) || bookingNumber.includes(searchTerm)
    })
  }

  // Transform data to match expected interface
  return filteredRequests.map(request => ({
    id: request.id,
    status: request.status,
    created_at: request.created_at,
    carrier_organization: { name: request.approving_org?.name || 'Unknown' },
    import_containers: request.import_container ? [{
      container_number: request.import_container.container_number,
      booking_number: request.export_booking?.booking_number || ''
    }] : []
  }))
}

export async function cancelStreetTurnRequest(requestId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Get user's organization
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized access')
  }

  // Verify request exists and belongs to user's organization
  const { data: request, error: requestError } = await supabase
    .from('street_turn_requests')
    .select('id, status, requesting_org_id')
    .eq('id', requestId)
    .eq('requesting_org_id', profile.organization_id)
    .single()

  if (requestError || !request) {
    throw new Error('Request not found')
  }

  if (request.status !== 'PENDING') {
    throw new Error('Can only cancel pending requests')
  }

  // Delete the request (this will cascade to related tables)
  const { error: deleteError } = await supabase
    .from('street_turn_requests')
    .delete()
    .eq('id', requestId)

  if (deleteError) {
    console.error('Error deleting request:', deleteError)
    throw new Error('Failed to cancel request')
  }

  return { success: true }
} 