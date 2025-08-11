import { NextRequest, NextResponse } from 'next/server'
import { eDepotService } from '@/lib/services/edepot'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/edepot
 * Authenticate user with eDepot system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      )
    }

    // Authenticate with eDepot
    const result = await eDepotService.login({
      user: email,
      password
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Xác thực thất bại' },
        { status: 401 }
      )
    }

    // Set secure HTTP-only cookie for eDepot session
    if (result.token && result.user) {
      const cookieStore = await cookies()
      
      const sessionData = {
        token: result.token,
        user: result.user,
        timestamp: Date.now()
      }

      cookieStore.set('edepot_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Đăng nhập thành công'
    })

  } catch (error) {
    console.error('eDepot authentication error:', error)
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/edepot
 * Logout from eDepot system
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Clear eDepot session cookie
    cookieStore.delete('edepot_session')
    
    return NextResponse.json({
      success: true,
      message: 'Đăng xuất thành công'
    })

  } catch (error) {
    console.error('eDepot logout error:', error)
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/edepot
 * Get current eDepot session
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('edepot_session')
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Không có phiên đăng nhập' },
        { status: 401 }
      )
    }

    const sessionData = JSON.parse(sessionCookie.value)
    
    // Check if session is expired (24 hours)
    const isExpired = Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000
    if (isExpired) {
      cookieStore.delete('edepot_session')
      return NextResponse.json(
        { error: 'Phiên đăng nhập đã hết hạn' },
        { status: 401 }
      )
    }

    // Return stored user data (optionally refresh from eDepot)
    // For now, we'll return the stored user data to avoid additional API calls
    // In production, you might want to refresh user data periodically
    
    return NextResponse.json({
      success: true,
      user: sessionData.user,
      token: sessionData.token
    })

  } catch (error) {
    console.error('eDepot session check error:', error)
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 }
    )
  }
}