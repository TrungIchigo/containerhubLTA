import { NextResponse } from 'next/server'
import { getCarrierCodRequests } from '@/lib/actions/cod'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { NextRequest } from 'next/server'
import { confirmCodCompletion, completeCodProcess } from '@/lib/actions/cod'

export async function GET() {
  try {
    console.log('🔍 [API] Loading carrier COD requests...')
    
    // Check authentication first
    const user = await getCurrentUser()
    console.log('🔍 [API] Current user:', user?.profile?.role, user?.profile?.organization?.name)
    
    if (!user) {
      console.log('❌ [API] No user found')
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.profile?.role !== 'CARRIER_ADMIN' && user.profile?.role !== 'PLATFORM_ADMIN') {
      console.log('❌ [API] Invalid role:', user.profile?.role)
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
    
    const codRequests = await getCarrierCodRequests()
    
    console.log('✅ [API] COD requests loaded:', codRequests?.length || 0, 'requests')
    
    return NextResponse.json({
      success: true,
      data: codRequests || []
    })

  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 

export async function POST(req: Request) {
  const body = await req.json();
  console.log('[DEBUG] API /api/cod/carrier-requests POST', body);
  try {
    // Kiểm tra authentication và authorization
    const user = await getCurrentUser();
    console.log('[DEBUG] API /api/cod/carrier-requests - Current user:', user?.profile?.role, user?.profile?.organization_id);
    
    if (!user) {
      console.log('[DEBUG] API /api/cod/carrier-requests - No user found');
      return new Response(JSON.stringify({ success: false, message: 'Authentication required' }), { status: 401 });
    }

    // Chỉ cho phép dispatcher thực hiện các action này
    if (user.profile?.role !== 'DISPATCHER') {
      console.log('[DEBUG] API /api/cod/carrier-requests - Invalid role:', user.profile?.role);
      return new Response(JSON.stringify({ success: false, message: 'Access denied - Only dispatchers can perform this action' }), { status: 403 });
    }

    // Chấp nhận cả action: 'confirm_cod_complete' và 'confirmCodCompletion'
    if (body.action === 'confirm_cod_complete' || body.action === 'confirmCodCompletion') {
      const result = await confirmCodCompletion(body.containerId);
      console.log('[DEBUG] API /api/cod/carrier-requests - confirmCodCompletion result:', result);
      return new Response(JSON.stringify(result), { status: 200 });
    }
    if (body.action === 'complete_cod_process') {
      const result = await completeCodProcess(body.containerId);
      console.log('[DEBUG] API /api/cod/carrier-requests - completeCodProcess result:', result);
      return new Response(JSON.stringify(result), { status: 200 });
    }
    return new Response(JSON.stringify({ success: false, message: 'Action không hợp lệ' }), { status: 400 });
  } catch (error: any) {
    console.error('[DEBUG] API /api/cod/carrier-requests - Exception:', error);
    return new Response(JSON.stringify({ success: false, message: 'Lỗi server' }), { status: 500 });
  }
} 