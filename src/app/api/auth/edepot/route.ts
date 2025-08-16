import { NextRequest, NextResponse } from 'next/server'
import { loginWithEdepot } from '@/lib/actions/edepot-auth'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/edepot
 * Handles eDepot authentication via API route
 * @description Authenticates user with eDepot system and creates session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email và mật khẩu là bắt buộc' 
        },
        { status: 400 }
      )
    }

    // Extract username from email (assuming email format like username@domain.com)
    // For eDepot, we typically use username instead of email
    const username = email.includes('@') ? email.split('@')[0] : email

    // Call the server action to handle eDepot login
    const result = await loginWithEdepot(username, password)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Đăng nhập eDepot thất bại' 
        },
        { status: 401 }
      )
    }

    // If successful, set eDepot session cookie
    const cookieStore = await cookies()
    const sessionData = {
      user: result.user,
      timestamp: Date.now(),
      source: 'edepot'
    }

    cookieStore.set('edepot_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return NextResponse.json({
      success: true,
      user: result.user,
      message: result.message || 'Đăng nhập eDepot thành công',
      redirectTo: result.redirectTo
    })

  } catch (error) {
    console.error('eDepot API route error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi server nội bộ' 
      },
      { status: 500 }
    )
  }
}