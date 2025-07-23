'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { createMarketplaceFee } from './billing'
import { debugUserData } from '../debug'

// Get carrier admin dashboard data
export async function getCarrierAdminDashboardData() {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id) {
      console.error('User missing organization_id:', user)
      throw new Error('User organization not found')
    }

    if (user.profile.role !== 'CARRIER_ADMIN') {
      console.error('User role is not CARRIER_ADMIN:', user.profile.role)
      throw new Error('Unauthorized - not a carrier admin')
    }

    const supabase = await createClient()
    const orgId = user.profile.organization_id

    console.log('Fetching data for carrier org_id:', orgId)

    // First, verify the organization exists and is active
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, type, status')
      .eq('id', orgId)
      .single()

    if (orgError || !organization) {
      console.error('Organization not found or error:', orgError)
      throw new Error('Organization not found')
    }

    if (organization.status !== 'ACTIVE') {
      console.error('Organization is not active:', organization.status)
      throw new Error('Organization is not active')
    }

    // Get COD requests for this shipping line
    const { data: codRequests, error: codError } = await supabase
      .from('cod_requests')
      .select(`
        *,
        import_container:import_containers!cod_requests_dropoff_order_id_fkey(
          id,
          container_number,
          container_type,
          drop_off_location
        ),
        requested_depot:gpg_depots!cod_requests_requested_depot_id_fkey(
          id,
          name,
          address
        ),
        requesting_org:organizations!cod_requests_requesting_org_id_fkey(
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (codError) {
      console.error('Error fetching COD requests:', codError)
    }

    // Get pending requests for this shipping line with better error handling
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('street_turn_requests')
      .select(`
        *,
        import_container:import_containers(
          id,
          container_number,
          container_type,
          drop_off_location,
          status,
          trucking_company:organizations!import_containers_trucking_company_org_id_fkey(
            id,
            name
          )
        ),
        export_booking:export_bookings(
          id,
          booking_number,
          required_container_type,
          pick_up_location,
          status,
          trucking_company:organizations!export_bookings_trucking_company_org_id_fkey(
            id,
            name
          )
        ),
        dropoff_trucking_org:organizations!street_turn_requests_dropoff_trucking_org_id_fkey(
          id,
          name
        )
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching pending requests:', requestsError)
      console.error('Query details - orgId:', orgId)
      
      // Check if it's a foreign key error
      if (requestsError.message?.includes('foreign key') || requestsError.message?.includes('violates')) {
        throw new Error(`Database foreign key constraint error: ${requestsError.message}`)
      }
      
      throw new Error(`Database query failed: ${requestsError.message}`)
    }

    console.log('Found pending requests:', pendingRequests?.length || 0)
    console.log('Found COD requests:', codRequests?.length || 0)

    // Get KPI data with individual error handling
    let approvedThisMonth = []
    let totalApproved = []
    
    try {
      // 2. Approved this month
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const { data: approvedData, error: approvedError } = await supabase
        .from('street_turn_requests')
        .select('id')
        .eq('status', 'APPROVED')
        .gte('created_at', thisMonth.toISOString())

      if (approvedError) {
        console.error('Error fetching approved this month:', approvedError)
      } else {
        approvedThisMonth = approvedData || []
      }
    } catch (error) {
      console.error('Error in approved this month query:', error)
    }

    try {
      // 3. Total approved (all time)
      const { data: totalData, error: totalError } = await supabase
        .from('street_turn_requests')
        .select('id')
        .eq('status', 'APPROVED')

      if (totalError) {
        console.error('Error fetching total approved:', totalError)
      } else {
        totalApproved = totalData || []
      }
    } catch (error) {
      console.error('Error in total approved query:', error)
    }

    const kpis = {
      pendingCount: pendingRequests?.length || 0,
      approvedThisMonth: approvedThisMonth.length,
      totalApproved: totalApproved.length,
      // COD specific KPIs
      pendingCodRequests: codRequests?.filter(r => r.status === 'PENDING').length || 0,
      approvedButUnpaidCodRequests: codRequests?.filter(r => ['APPROVED', 'PENDING_PAYMENT'].includes(r.status)).length || 0
    }

    console.log('KPI data:', kpis)

    return {
      pendingRequests: pendingRequests || [],
      codRequests: codRequests || [],
      kpis,
      organization
    }

  } catch (error: any) {
    console.error('Error in getCarrierAdminDashboardData:', error)
    
    // Re-throw with better error context
    if (error.message?.includes('organization not found')) {
      throw new Error('User organization not found')
    } else if (error.message?.includes('Unauthorized')) {
      throw new Error('Unauthorized - not a carrier admin')
    } else if (error.message?.includes('foreign key')) {
      throw new Error('Database schema error - foreign key constraint')
    } else {
      throw new Error(`Failed to fetch carrier admin data: ${error.message}`)
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

  // Update container and booking status to PROCESSING
  const { error: containerError } = await supabase
    .from('import_containers')
    .update({ status: 'PROCESSING' })
    .eq('id', request.import_container_id)

  const { error: bookingError } = await supabase
    .from('export_bookings')
    .update({ status: 'CONFIRMED' })
    .eq('id', request.export_booking_id)

  if (containerError || bookingError) {
    console.error('Error updating container/booking status:', { containerError, bookingError })
    // Don't throw here as the main operation succeeded
  }

  // Tạo phí giao dịch marketplace nếu là loại MARKETPLACE
  if (request.match_type === 'MARKETPLACE') {
    const billingResult = await createMarketplaceFee(
      request.pickup_trucking_org_id, // Bên "mua" cơ hội sẽ trả phí
      requestId
    )

    if (!billingResult.success) {
      console.error('Warning: Không thể tạo phí giao dịch marketplace:', billingResult.error)
      // Không throw error vì request đã được approved thành công
    }
  }

  // Revalidate all relevant pages
  revalidatePath('/carrier-admin')
  revalidatePath('/dispatcher')
  revalidatePath('/dispatcher/requests')
}

// Decline street-turn request - SERVER ACTION
export async function declineRequest(requestId: string, reason: string) {
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
    .eq('status', 'PENDING') // Only pending requests can be declined
    .single()

  if (requestError || !request) {
    console.error('Error fetching request or unauthorized:', requestError)
    throw new Error('Request not found or unauthorized')
  }

  // Update request status to DECLINED with reason
  const { error: updateError } = await supabase
    .from('street_turn_requests')
    .update({ 
      status: 'DECLINED',
      decline_reason: reason,
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

  // Revalidate all relevant pages
  revalidatePath('/carrier-admin')
  revalidatePath('/dispatcher')
  revalidatePath('/dispatcher/requests')
} 