/**
 * eDepot API Integration Service
 * Handles authentication and data synchronization with eDepot system
 */

export interface EDepotLoginRequest {
  user: string
  password: string
}

export interface EDepotLoginResponse {
  success: boolean
  token?: string
  user?: {
    id: string
    username: string
    email: string
    fullName?: string
    role?: string
    organizationId?: string
    organizationName?: string
  }
  message?: string
  error?: string
}

export interface EDepotUserData {
  id: string
  username: string
  email: string
  fullName?: string
  role?: string
  organizationId?: string
  organizationName?: string
  profile?: {
    phone?: string
    address?: string
    department?: string
  }
  permissions?: string[]
  lastLoginAt?: string
  createdAt?: string
}

class EDepotService {
  private readonly baseUrl = 'https://apiedepottest.gsotgroup.vn/api'
  private readonly timeout = 10000 // 10 seconds

  /**
   * Authenticate user with eDepot system
   */
  async login(credentials: EDepotLoginRequest): Promise<EDepotLoginResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}/Users/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Tài khoản hoặc mật khẩu không chính xác'
          }
        }
        if (response.status === 404) {
          return {
            success: false,
            error: 'Tài khoản không tồn tại trong hệ thống eDepot'
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Transform response to match our interface
      return {
        success: true,
        token: data.token || data.accessToken,
        user: {
          id: data.user?.id || data.userId,
          username: data.user?.username || data.user?.userName || credentials.user,
          email: data.user?.email || data.email,
          fullName: data.user?.fullName || data.user?.displayName,
          role: data.user?.role || data.role,
          organizationId: data.user?.organizationId || data.organizationId,
          organizationName: data.user?.organizationName || data.organization?.name,
        },
        message: data.message
      }
    } catch (error) {
      console.error('eDepot login error:', error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Kết nối tới eDepot bị timeout. Vui lòng thử lại.'
          }
        }
        return {
          success: false,
          error: `Lỗi kết nối eDepot: ${error.message}`
        }
      }
      
      return {
        success: false,
        error: 'Không thể kết nối tới hệ thống eDepot'
      }
    }
  }

  /**
   * Get user data from eDepot system
   */
  async getUserData(token: string, userId: string): Promise<EDepotUserData | null> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}/Users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`Failed to get user data: HTTP ${response.status}`)
        return null
      }

      const data = await response.json()
      
      return {
        id: data.id,
        username: data.username || data.userName,
        email: data.email,
        fullName: data.fullName || data.displayName,
        role: data.role,
        organizationId: data.organizationId,
        organizationName: data.organizationName || data.organization?.name,
        profile: {
          phone: data.phone || data.profile?.phone,
          address: data.address || data.profile?.address,
          department: data.department || data.profile?.department,
        },
        permissions: data.permissions || [],
        lastLoginAt: data.lastLoginAt,
        createdAt: data.createdAt,
      }
    } catch (error) {
      console.error('Error getting eDepot user data:', error)
      return null
    }
  }

  /**
   * Check if user exists in eDepot system
   */
  async checkUserExists(username: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}/Users/check/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.error('Error checking user existence:', error)
      return false
    }
  }
}

// Export singleton instance
export const eDepotService = new EDepotService()
export default eDepotService