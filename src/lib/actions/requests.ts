import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface StreetTurnRequestFilters {
  search?: string
  status?: 'PENDING' | 'APPROVED' | 'DECLINED'
}

export async function getStreetTurnRequests(filters: StreetTurnRequestFilters = {}) {
  try {
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

    console.log('Fetching requests for organization:', profile.organization_id)

    // First, try a simple query to see if basic access works
    const { data: basicRequests, error: basicError } = await supabase
      .from('street_turn_requests')
      .select('id, status, created_at, dropoff_trucking_org_id, pickup_trucking_org_id, approving_org_id, match_type')
      .or(`pickup_trucking_org_id.eq.${profile.organization_id},dropoff_trucking_org_id.eq.${profile.organization_id}`)
      .order('created_at', { ascending: false })

    if (basicError) {
      console.error('Basic query failed:', basicError)
      throw new Error(`Database access error: ${basicError.message}`)
    }

    console.log('Basic requests found:', basicRequests?.length || 0)

    // If basic query works, try detailed query with foreign key joins
    let query = supabase
      .from('street_turn_requests')
      .select(`
        id,
        status,
        match_type,
        dropoff_org_approval_status,
        auto_approved_by_rule_id,
        created_at,
        import_container_id,
        export_booking_id,
        dropoff_trucking_org_id,
        pickup_trucking_org_id,
        approving_org_id,
        estimated_cost_saving,
        estimated_co2_saving_kg,
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
        ),
        dropoff_trucking_org:organizations!street_turn_requests_dropoff_trucking_org_id_fkey(
          name
        ),
        pickup_trucking_org:organizations!street_turn_requests_pickup_trucking_org_id_fkey(
          name
        )
      `)
      .or(`pickup_trucking_org_id.eq.${profile.organization_id},dropoff_trucking_org_id.eq.${profile.organization_id}`)
      .order('created_at', { ascending: false })

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data: requests, error: requestsError } = await query

    if (requestsError) {
      console.error('Detailed query failed:', requestsError)
      
      // Fallback: Use basic query with manual organization lookup
      console.log('Falling back to basic query with manual lookups...')
      
      let fallbackRequests = basicRequests || []
      
      // Apply status filter to fallback
      if (filters.status) {
        fallbackRequests = fallbackRequests.filter(req => req.status === filters.status)
      }

      // Get organization names separately
      const orgIds = [
        ...new Set([
          ...fallbackRequests.map(req => req.approving_org_id),
          ...fallbackRequests.map(req => req.dropoff_trucking_org_id),
          ...fallbackRequests.map(req => req.pickup_trucking_org_id)
        ].filter(Boolean))
      ]

      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)

      const orgMap = Object.fromEntries(
        (organizations || []).map(org => [org.id, org.name])
      )

      // Get container and booking details separately
      const containerIds = fallbackRequests.map(req => req.import_container_id).filter(Boolean)
      const bookingIds = fallbackRequests.map(req => req.export_booking_id).filter(Boolean)

      const [{ data: containers }, { data: bookings }] = await Promise.all([
        supabase
          .from('import_containers')
          .select('id, container_number, container_type, drop_off_location, available_from_datetime')
          .in('id', containerIds),
        supabase
          .from('export_bookings')
          .select('id, booking_number, required_container_type, pick_up_location, needed_by_datetime')
          .in('id', bookingIds)
      ])

      const containerMap = Object.fromEntries(
        (containers || []).map(c => [c.id, c])
      )
      const bookingMap = Object.fromEntries(
        (bookings || []).map(b => [b.id, b])
      )

      // Transform fallback data
      const transformedRequests = fallbackRequests.map(request => ({
        id: request.id,
        status: request.status,
        match_type: request.match_type || 'INTERNAL',
        dropoff_org_approval_status: request.dropoff_org_approval_status,
        auto_approved_by_rule_id: request.auto_approved_by_rule_id,
        created_at: request.created_at,
        carrier_organization: { 
          name: orgMap[request.approving_org_id] || 'Unknown' 
        },
        partner_organization: request.match_type === 'MARKETPLACE' ? 
          { 
            id: request.dropoff_trucking_org_id,
            name: orgMap[request.dropoff_trucking_org_id] || 'Unknown' 
          } : null,
        import_containers: request.import_container_id && containerMap[request.import_container_id] ? [{
          container_number: containerMap[request.import_container_id].container_number,
          booking_number: request.export_booking_id && bookingMap[request.export_booking_id] 
            ? bookingMap[request.export_booking_id].booking_number 
            : ''
        }] : []
      }))

      return applySearchFilter(transformedRequests, filters.search)
    }

    let filteredRequests = requests || []

    // Transform successful detailed query data
    const transformedRequests = filteredRequests.map(request => ({
      id: request.id,
      status: request.status,
      match_type: request.match_type || 'INTERNAL',
      dropoff_org_approval_status: request.dropoff_org_approval_status,
      auto_approved_by_rule_id: request.auto_approved_by_rule_id,
      created_at: request.created_at,
      carrier_organization: { name: request.approving_org?.name || 'Unknown' },
      partner_organization: request.match_type === 'MARKETPLACE' ? 
        { 
          id: request.dropoff_trucking_org_id,
          name: request.dropoff_trucking_org?.name || 'Unknown' 
        } : null,
      import_containers: request.import_container ? [{
        container_number: request.import_container.container_number,
        booking_number: request.export_booking?.booking_number || ''
      }] : []
    }))

    return applySearchFilter(transformedRequests, filters.search)

  } catch (error: any) {
    console.error('Error in getStreetTurnRequests:', error)
    
    // Return empty array with error logged instead of throwing
    // This prevents the whole page from breaking
    return []
  }
}

function applySearchFilter(requests: any[], search?: string) {
  if (!search) return requests

  const searchTerm = search.toLowerCase()
  return requests.filter(request => {
    const containerNumbers = request.import_containers?.map((c: any) => c.container_number?.toLowerCase()) || []
    const bookingNumbers = request.import_containers?.map((c: any) => c.booking_number?.toLowerCase()) || []
    
    return [
      ...containerNumbers,
      ...bookingNumbers
    ].some(value => value && value.includes(searchTerm))
  })
}

export async function cancelStreetTurnRequest(requestId: string) {
  try {
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
      .select('id, status, pickup_trucking_org_id, dropoff_trucking_org_id, import_container_id, export_booking_id')
      .eq('id', requestId)
      .or(`pickup_trucking_org_id.eq.${profile.organization_id},dropoff_trucking_org_id.eq.${profile.organization_id}`)
      .single()

    if (requestError || !request) {
      throw new Error('Request not found')
    }

    if (request.status !== 'PENDING') {
      throw new Error('Can only cancel pending requests')
    }

    // Revert container and booking status before deleting request
    if (request.import_container_id) {
      await supabase
        .from('import_containers')
        .update({ status: 'AVAILABLE' })
        .eq('id', request.import_container_id)
    }

    if (request.export_booking_id) {
      await supabase
        .from('export_bookings')
        .update({ status: 'AVAILABLE' })
        .eq('id', request.export_booking_id)
    }

    // Delete the request
    const { error: deleteError } = await supabase
      .from('street_turn_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error deleting request:', deleteError)
      throw new Error('Failed to cancel request')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in cancelStreetTurnRequest:', error)
    throw new Error(error.message || 'Failed to cancel request')
  }
} 