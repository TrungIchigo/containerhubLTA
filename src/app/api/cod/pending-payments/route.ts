import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get user profile and check if they have admin privileges
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 })
    }

    // Check if user has permission to view billing data (admin or carrier admin)
    if (profile.role !== 'CARRIER_ADMIN' && profile.organization?.type !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only admins can view COD payment requests.' 
      }, { status: 403 })
    }

    // Fetch COD requests with PENDING_PAYMENT status
    // Valid statuses: PENDING, APPROVED, DECLINED, AWAITING_INFO, EXPIRED, REVERSED, PENDING_PAYMENT, PAID, PROCESSING_AT_DEPOT, COMPLETED, CANCELLED
    const { data: codRequests, error: codError } = await supabase
      .from('cod_requests')
      .select(`
        id,
        status,
        cod_fee,
        delivery_confirmed_at,
        import_container:import_containers!dropoff_order_id(
          container_number
        ),
        requesting_org:organizations!requesting_org_id(
          name
        )
      `)
      .eq('status', 'PENDING_PAYMENT')
      .not('cod_fee', 'is', null)
      .order('delivery_confirmed_at', { ascending: true })

    if (codError) {
      console.error('Error fetching COD payment requests:', codError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch COD payment requests' 
      }, { status: 500 })
    }

    // Transform data for frontend
    const transformedData = (codRequests || []).map((request: any) => {
      return {
        id: request.id,
        container_number: request.import_container?.container_number || 'N/A',
        requesting_org_name: request.requesting_org?.name || 'N/A',
        cod_fee: request.cod_fee,
        status: request.status,
        delivery_confirmed_at: request.delivery_confirmed_at
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    })

  } catch (error: any) {
    console.error('Unexpected error in COD pending payments API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}