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

  if (profileError || !profile || profile.role !== 'DISPATCHER') {
    throw new Error('Unauthorized access')
  }

  // For now, return mock data to test the UI structure
  // TODO: Replace with actual Supabase query once we understand the data structure
  const mockRequests = [
    {
      id: 'req-001-test-abc123',
      status: 'PENDING' as const,
      created_at: new Date().toISOString(),
      carrier_organization: { name: 'Hãng tàu ABC' },
      import_containers: [
        { container_number: 'ABCD1234567', booking_number: 'BK001' }
      ]
    },
    {
      id: 'req-002-test-def456',
      status: 'APPROVED' as const,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      carrier_organization: { name: 'Hãng tàu XYZ' },
      import_containers: [
        { container_number: 'XYZA9876543', booking_number: 'BK002' }
      ]
    },
    {
      id: 'req-003-test-ghi789',
      status: 'DECLINED' as const,
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      carrier_organization: { name: 'Hãng tàu DEF' },
      import_containers: [
        { container_number: 'DEFG5555555', booking_number: 'BK003' }
      ]
    }
  ]

  // Apply filters
  let filteredRequests = mockRequests

  if (filters.status) {
    filteredRequests = filteredRequests.filter(request => request.status === filters.status)
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredRequests = filteredRequests.filter(request => {
      const containers = request.import_containers || []
      return containers.some(container => {
        const containerNumber = container.container_number?.toLowerCase() || ''
        const bookingNumber = container.booking_number?.toLowerCase() || ''
        return containerNumber.includes(searchTerm) || bookingNumber.includes(searchTerm)
      })
    })
  }

  return filteredRequests
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