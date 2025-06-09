'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

// Get carrier admin dashboard data
export async function getCarrierAdminDashboardData() {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()
  const orgId = user.profile.organization_id

  // Get pending requests for this shipping line
  const { data: pendingRequests, error: requestsError } = await supabase
    .from('street_turn_requests')
    .select(`
      *,
      import_container:import_containers(
        *,
        trucking_company:organizations!import_containers_trucking_company_org_id_fkey(*)
      ),
      export_booking:export_bookings(
        *,
        trucking_company:organizations!export_bookings_trucking_company_org_id_fkey(*)
      ),
      requesting_org:organizations!street_turn_requests_requesting_org_id_fkey(*)
    `)
    .eq('approving_org_id', orgId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })

  if (requestsError) {
    console.error('Error fetching pending requests:', requestsError)
    throw requestsError
  }

  // Get KPI data
  // 1. Pending requests count
  const pendingCount = pendingRequests?.length || 0

  // 2. Approved this month
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  
  const { data: approvedThisMonth } = await supabase
    .from('street_turn_requests')
    .select('id')
    .eq('approving_org_id', orgId)
    .eq('status', 'APPROVED')
    .gte('created_at', thisMonth.toISOString())

  // 3. Total approved (all time)
  const { data: totalApproved } = await supabase
    .from('street_turn_requests')
    .select('id')
    .eq('approving_org_id', orgId)
    .eq('status', 'APPROVED')

  return {
    pendingRequests: pendingRequests || [],
    kpis: {
      pendingCount,
      approvedThisMonth: approvedThisMonth?.length || 0,
      totalApproved: totalApproved?.length || 0
    }
  }
}

// Approve street-turn request - SERVER ACTION
export async function approveRequest(requestId: string) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  // First, get the request details to verify permissions and get related IDs
  const { data: request, error: requestError } = await supabase
    .from('street_turn_requests')
    .select('*')
    .eq('id', requestId)
    .eq('approving_org_id', user.profile.organization_id) // Ensure this user can approve this request
    .eq('status', 'PENDING') // Only pending requests can be approved
    .single()

  if (requestError || !request) {
    console.error('Error fetching request or unauthorized:', requestError)
    throw new Error('Request not found or unauthorized')
  }

  // Update request status to APPROVED
  const { error: updateError } = await supabase
    .from('street_turn_requests')
    .update({ 
      status: 'APPROVED',
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (updateError) {
    console.error('Error approving request:', updateError)
    throw updateError
  }

  // Update container and booking status to CONFIRMED
  const { error: containerError } = await supabase
    .from('import_containers')
    .update({ status: 'CONFIRMED' })
    .eq('id', request.import_container_id)

  const { error: bookingError } = await supabase
    .from('export_bookings')
    .update({ status: 'CONFIRMED' })
    .eq('id', request.export_booking_id)

  if (containerError || bookingError) {
    console.error('Error updating container/booking status:', { containerError, bookingError })
    // Don't throw here as the main operation succeeded
  }

  // Revalidate both pages
  revalidatePath('/carrier-admin')
  revalidatePath('/dispatcher')
}

// Decline street-turn request - SERVER ACTION
export async function declineRequest(requestId: string) {
  const user = await getCurrentUser()
  
  if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
    throw new Error('Unauthorized')
  }

  const supabase = await createClient()

  // First, get the request details to verify permissions and get related IDs
  const { data: request, error: requestError } = await supabase
    .from('street_turn_requests')
    .select('*')
    .eq('id', requestId)
    .eq('approving_org_id', user.profile.organization_id) // Ensure this user can decline this request
    .eq('status', 'PENDING') // Only pending requests can be declined
    .single()

  if (requestError || !request) {
    console.error('Error fetching request or unauthorized:', requestError)
    throw new Error('Request not found or unauthorized')
  }

  // Update request status to DECLINED
  const { error: updateError } = await supabase
    .from('street_turn_requests')
    .update({ 
      status: 'DECLINED',
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (updateError) {
    console.error('Error declining request:', updateError)
    throw updateError
  }

  // ROLLBACK: Update container and booking status back to AVAILABLE/PENDING
  const { error: containerError } = await supabase
    .from('import_containers')
    .update({ status: 'AVAILABLE' })
    .eq('id', request.import_container_id)

  const { error: bookingError } = await supabase
    .from('export_bookings')
    .update({ status: 'AVAILABLE' })
    .eq('id', request.export_booking_id)

  if (containerError || bookingError) {
    console.error('Error rolling back container/booking status:', { containerError, bookingError })
    // Don't throw here as the main operation succeeded
  }

  // Revalidate both pages
  revalidatePath('/carrier-admin')
  revalidatePath('/dispatcher')
} 