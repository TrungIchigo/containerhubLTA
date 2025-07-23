import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Only dispatchers can access container COD requests' },
        { status: 403 }
      )
    }

    const { containerId } = await request.json()
    
    if (!containerId) {
      return NextResponse.json(
        { success: false, error: 'Container ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get COD requests for the specific container
    const { data: codRequests, error } = await supabase
      .from('cod_requests')
      .select(`
        id,
        status,
        cod_fee,
        dropoff_order_id,
        requesting_org_id,
        original_depot_address,
        requested_depot_id,
        delivery_confirmed_at,
        created_at,
        import_container:import_containers!dropoff_order_id(
          id,
          container_number,
          status
        )
      `)
      .eq('dropoff_order_id', containerId)
      .eq('requesting_org_id', user.profile.organization_id) // Only own organization requests
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching COD requests:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch COD requests' },
        { status: 500 }
      )
    }

    // Get depot names for requested_depot_id
    const depotIds = codRequests?.map(item => item.requested_depot_id).filter(Boolean) || [];
    let depotMap: Record<string, string> = {};
    
    if (depotIds.length > 0) {
      const { data: depots } = await supabase
        .from('gpg_depots')
        .select('id, name')
        .in('id', depotIds);
      
      if (depots) {
        depotMap = Object.fromEntries(depots.map(depot => [depot.id, depot.name]));
      }
    }

    // Transform data to include depot names
    const transformedData = codRequests?.map(item => ({
      ...item,
      requested_depot_name: depotMap[item.requested_depot_id] || 'N/A'
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData
    })

  } catch (error: any) {
    console.error('Error in container COD requests API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 