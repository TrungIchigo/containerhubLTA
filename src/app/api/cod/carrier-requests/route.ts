import { NextResponse } from 'next/server'
import { getCarrierCodRequests } from '@/lib/actions/cod'
import { getCurrentUser } from '@/lib/actions/auth'

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