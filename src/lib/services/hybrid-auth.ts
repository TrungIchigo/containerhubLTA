/**
 * Hybrid Authentication Service
 * Handles authentication logic for both Supabase and eDepot systems
 */

import { createClient } from '@/lib/supabase/client'
import { eDepotService, type EDepotLoginRequest, type EDepotLoginResponse, type EDepotUserData } from './edepot'
import type { User } from '@supabase/supabase-js'

export interface HybridAuthResult {
  success: boolean
  source: 'supabase' | 'edepot' | 'none'
  user?: User | null
  eDepotUser?: EDepotUserData
  eDepotToken?: string
  redirectTo?: string
  error?: string
  requiresEDepotRegistration?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

class HybridAuthService {
  private supabase = createClient()

  /**
   * Main authentication method that checks both Supabase and eDepot
   */
  async authenticate(credentials: LoginCredentials): Promise<HybridAuthResult> {
    try {
      // Step 1: Try Supabase authentication first
      const supabaseResult = await this.authenticateWithSupabase(credentials)
      
      if (supabaseResult.success && supabaseResult.user) {
        return {
          success: true,
          source: 'supabase',
          user: supabaseResult.user,
          redirectTo: await this.getRedirectPath(supabaseResult.user.id)
        }
      }

      // Step 2: If Supabase fails, try eDepot authentication
      const eDepotResult = await this.authenticateWithEDepot(credentials)
      
      if (eDepotResult.success && eDepotResult.user && eDepotResult.token) {
        // Get full user data from eDepot
        const eDepotUserData = await eDepotService.getUserData(eDepotResult.token, eDepotResult.user.id)
        
        if (eDepotUserData) {
          return {
            success: true,
            source: 'edepot',
            eDepotUser: eDepotUserData,
            eDepotToken: eDepotResult.token,
            redirectTo: '/dashboard' // Default redirect for eDepot users
          }
        }
      }

      // Step 3: If both fail, check if user should register with eDepot
      const shouldRegisterEDepot = await this.shouldRedirectToEDepotRegistration(credentials.email)
      
      if (shouldRegisterEDepot) {
        return {
          success: false,
          source: 'none',
          requiresEDepotRegistration: true,
          redirectTo: '/auth/edepot-register',
          error: 'Tài khoản chưa tồn tại trong hệ thống eDepot. Vui lòng đăng ký.'
        }
      }

      // Step 4: Authentication failed completely
      return {
        success: false,
        source: 'none',
        error: 'Email hoặc mật khẩu không chính xác.'
      }

    } catch (error) {
      console.error('Hybrid authentication error:', error)
      return {
        success: false,
        source: 'none',
        error: 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.'
      }
    }
  }

  /**
   * Authenticate with Supabase
   */
  private async authenticateWithSupabase(credentials: LoginCredentials): Promise<{ success: boolean; user?: User | null; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Supabase authentication error:', error)
      return { success: false, error: 'Lỗi xác thực Supabase' }
    }
  }

  /**
   * Authenticate with eDepot via API route
   */
  private async authenticateWithEDepot(credentials: LoginCredentials): Promise<EDepotLoginResponse> {
    try {
      const response = await fetch('/api/auth/edepot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Xác thực eDepot thất bại'
        }
      }

      return {
        success: true,
        user: data.user,
        token: 'server-managed', // Token is managed server-side via cookies
        message: data.message
      }
    } catch (error) {
      console.error('eDepot API authentication error:', error)
      return {
        success: false,
        error: 'Không thể kết nối tới hệ thống eDepot'
      }
    }
  }

  /**
   * Get redirect path based on user role
   */
  private async getRedirectPath(userId: string): Promise<string> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profile?.role === 'DISPATCHER') {
        return '/dispatcher'
      } else if (profile?.role === 'CARRIER_ADMIN') {
        return '/carrier-admin'
      } else {
        return '/dashboard'
      }
    } catch (error) {
      console.error('Error getting user role:', error)
      return '/dashboard'
    }
  }

  /**
   * Determine if user should be redirected to eDepot registration
   */
  private async shouldRedirectToEDepotRegistration(email: string): Promise<boolean> {
    try {
      // Check if this looks like a business email that should use eDepot
      const businessDomains = [
        'gsotgroup.vn',
        'edepot.vn',
        // Add more business domains as needed
      ]

      const emailDomain = email.split('@')[1]?.toLowerCase()
      if (businessDomains.includes(emailDomain)) {
        return true
      }

      // Additional logic: check if user exists in eDepot but with different credentials
      const userExistsInEDepot = await eDepotService.checkUserExists(email)
      return userExistsInEDepot

    } catch (error) {
      console.error('Error checking eDepot registration requirement:', error)
      return false
    }
  }

  /**
   * Create or sync user profile from eDepot data
   */
  async syncEDepotUserToSupabase(eDepotUser: EDepotUserData, eDepotToken: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Check if user already exists in Supabase
      const { data: existingUser } = await this.supabase.auth.getUser()
      
      if (existingUser?.user) {
        // Update existing user profile with eDepot data
        await this.updateSupabaseProfileFromEDepot(existingUser.user.id, eDepotUser)
        return { success: true, user: existingUser.user }
      }

      // Create new user in Supabase (this would require admin privileges)
      // For now, we'll store eDepot user data in session/localStorage
      this.storeEDepotUserSession(eDepotUser, eDepotToken)
      
      return { success: true }
    } catch (error) {
      console.error('Error syncing eDepot user to Supabase:', error)
      return { success: false, error: 'Không thể đồng bộ dữ liệu người dùng' }
    }
  }

  /**
   * Update Supabase profile with eDepot data
   */
  private async updateSupabaseProfileFromEDepot(userId: string, eDepotUser: EDepotUserData): Promise<void> {
    try {
      await this.supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: eDepotUser.fullName,
          phone: eDepotUser.profile?.phone,
          address: eDepotUser.profile?.address,
          department: eDepotUser.profile?.department,
          edepot_user_id: eDepotUser.id,
          edepot_username: eDepotUser.username,
          edepot_organization_id: eDepotUser.organizationId,
          edepot_organization_name: eDepotUser.organizationName,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error updating Supabase profile:', error)
    }
  }

  /**
   * Store eDepot user data in session for temporary access
   */
  private storeEDepotUserSession(eDepotUser: EDepotUserData, token: string): void {
    try {
      const sessionData = {
        user: eDepotUser,
        token,
        source: 'edepot',
        timestamp: Date.now()
      }
      
      sessionStorage.setItem('edepot_session', JSON.stringify(sessionData))
      
      // Also store in localStorage for persistence across tabs
      localStorage.setItem('edepot_user', JSON.stringify(eDepotUser))
    } catch (error) {
      console.error('Error storing eDepot session:', error)
    }
  }

  /**
   * Get stored eDepot user session from server
   */
  async getEDepotUserSession(): Promise<{ user: EDepotUserData; token: string } | null> {
    try {
      const response = await fetch('/api/auth/edepot', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      
      if (data.success && data.user) {
        return { user: data.user, token: data.token }
      }

      return null
    } catch (error) {
      console.error('Error getting eDepot session:', error)
      return null
    }
  }

  /**
   * Clear eDepot session data
   */
  async clearEDepotSession(): Promise<void> {
    try {
      await fetch('/api/auth/edepot', {
        method: 'DELETE',
        credentials: 'include'
      })
      
      // Also clear any client-side storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('edepot_session')
        localStorage.removeItem('edepot_user')
      }
    } catch (error) {
      console.error('Error clearing eDepot session:', error)
    }
  }
}

// Export singleton instance
export const hybridAuthService = new HybridAuthService()
export default hybridAuthService