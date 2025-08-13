import { NextRequest, NextResponse } from 'next/server'
import { eDepotService } from '@/lib/services/edepot'
import { cookies } from 'next/headers'

/**
 * GET /api/edepot/users
 * Get all users from eDepot system for testing purposes
 */
export async function GET(request: NextRequest) {
  try {
    // Test some known usernames instead of getting all users
    // since the /Users endpoint returns 500 error
    const testUsernames = ['020202022', '030303033', '040404044', 'admin', 'test']
    const userCheckResults: Array<{
      username: string
      exists: boolean
      status: string
    }> = []

    for (const username of testUsernames) {
      const exists = await eDepotService.checkUserExists(username)
      userCheckResults.push({
        username,
        exists,
        status: exists ? 'Tồn tại' : 'Không tồn tại'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Kiểm tra tài khoản eDepot thành công',
      note: 'Endpoint /Users trả về lỗi 500, sử dụng checkUserExists thay thế',
      userChecks: userCheckResults,
      count: userCheckResults.filter(u => u.exists).length
    })

  } catch (error) {
    console.error('Error checking eDepot users:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Lỗi server nội bộ khi kiểm tra tài khoản eDepot',
        userChecks: [],
        count: 0
      },
      { status: 500 }
    )
  }
}