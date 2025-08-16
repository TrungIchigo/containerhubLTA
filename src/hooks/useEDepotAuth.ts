'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { hybridAuthService } from '@/lib/services/hybrid-auth'
import type { EDepotUserData } from '@/lib/services/edepot'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  fullName?: string
  role?: string
  organizationId?: string
  organizationName?: string
  source: 'supabase' | 'edepot'
  supabaseUser?: User
  eDepotUser?: EDepotUserData
}

export interface UseEDepotAuthReturn {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

/**
 * Creates a promise that rejects after the specified timeout
 * @param ms - Timeout in milliseconds
 * @param message - Error message for timeout
 * @returns Promise that rejects after timeout
 */
const createTimeoutPromise = (ms: number, message: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms)
  })
}

/**
 * Wraps a promise with timeout functionality
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Error message for timeout
 * @returns Promise that resolves or rejects with timeout
 */
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs, timeoutMessage)
  ]) as Promise<T>
}

export function useEDepotAuth(): UseEDepotAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)
  const isLoadingRef = useRef(false)

  /**
   * Loads user authentication data from Supabase or eDepot
   * Handles timeouts and errors gracefully
   */
  const loadUser = useCallback(async () => {
    // Prevent multiple concurrent loadUser calls
    if (isLoadingRef.current) {
      return
    }
    
    // Cancel any previous ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current
    isLoadingRef.current = true

    try {
      setIsLoading(true)
      
      // Check if request was cancelled
      if (signal.aborted) return
      
      // First, try Supabase authentication
      const supabaseUser = await loadSupabaseUser(signal)
      if (supabaseUser) {
        return
      }
      
      // Check if request was cancelled
      if (signal.aborted) return
      
      // If no Supabase user, try eDepot session
      const eDepotUser = await loadEDepotUser(signal)
      if (eDepotUser) {
        return
      }
      
      // No authentication found
      if (!signal.aborted) {
        setUser(null)
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('useEDepotAuth: Error loading user:', error)
        setUser(null)
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false)
      }
      isLoadingRef.current = false
    }
  }, [])

  /**
   * Loads Supabase user and profile data
   * @param signal - AbortSignal for cancellation
   * @returns Promise<boolean> - true if user was loaded successfully
   */
  const loadSupabaseUser = async (signal: AbortSignal): Promise<boolean> => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getUser(),
        10000,
        'Supabase auth timeout'
      )
      
      if (signal.aborted) return false
      
      if (error) {
        // Only log significant errors
        if (!error.message.includes('Auth session missing')) {
          console.warn('useEDepotAuth: Supabase auth error:', error.message)
        }
        return false
      }
      
      if (!data.user) {
        return false
      }
      
      // Try to get user profile
      let profile: any = null
      try {
        const { data: profileData, error: profileError } = await withTimeout(
          Promise.resolve(
            supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()
          ),
          8000,
          'Profile fetch timeout'
        )
        
        if (!profileError && profileData) {
          profile = profileData
        } else if (profileError && !profileError.message.includes('No rows')) {
          console.warn('useEDepotAuth: Profile query error:', profileError.message)
        }
      } catch (profileError) {
        // Profile fetch failed, continue without profile
        console.warn('useEDepotAuth: Profile fetch failed, using basic user data')
      }
      
      if (signal.aborted) return false
      
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        fullName: profile?.full_name || data.user.user_metadata?.full_name,
        role: profile?.role,
        organizationId: profile?.organization_id,
        organizationName: profile?.organization_name,
        source: 'supabase',
        supabaseUser: data.user
      })
      
      return true
    } catch (error) {
      if (!signal.aborted) {
        console.warn('useEDepotAuth: Supabase user load failed:', error)
      }
      return false
    }
  }

  /**
   * Loads eDepot user session data
   * @param signal - AbortSignal for cancellation
   * @returns Promise<boolean> - true if user was loaded successfully
   */
  const loadEDepotUser = async (signal: AbortSignal): Promise<boolean> => {
    try {
      const eDepotSession = await withTimeout(
        hybridAuthService.getEDepotUserSession(),
        6000,
        'eDepot session timeout'
      )
      
      if (signal.aborted) return false
      
      if (!eDepotSession?.user) {
        return false
      }
      
      setUser({
        id: eDepotSession.user.id,
        email: eDepotSession.user.email,
        fullName: eDepotSession.user.fullName,
        role: eDepotSession.user.role,
        organizationId: eDepotSession.user.organizationId,
        organizationName: eDepotSession.user.organizationName,
        source: 'edepot',
        eDepotUser: eDepotSession.user
      })
      
      return true
    } catch (error) {
      if (!signal.aborted) {
        console.warn('useEDepotAuth: eDepot user load failed:', error)
      }
      return false
    }
  }

  /**
   * Logs out the current user from both Supabase and eDepot
   * Always clears user state regardless of logout success
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Cancel any ongoing loadUser requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      isLoadingRef.current = false
      
      // Clear user state immediately for better UX
      setUser(null)
      
      // Attempt to logout from Supabase with timeout
      try {
        await withTimeout(
          supabase.auth.signOut(),
          3000,
          'Supabase logout timeout'
        )
      } catch (supabaseError) {
        console.warn('useEDepotAuth: Supabase logout failed:', supabaseError)
        // Continue with eDepot logout even if Supabase fails
      }
      
      // Clear eDepot session with timeout
      try {
        await withTimeout(
          hybridAuthService.clearEDepotSession(),
          3000,
          'eDepot logout timeout'
        )
      } catch (eDepotError) {
        console.warn('useEDepotAuth: eDepot logout failed:', eDepotError)
        // Continue regardless of eDepot logout failure
      }
      
    } catch (error) {
      console.error('useEDepotAuth: Logout error:', error)
      // User state already cleared above
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  /**
   * Refreshes the current user authentication state
   * Useful for manual refresh after authentication changes
   */
  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [loadUser])

  // Load user on mount
  useEffect(() => {
    loadUser()
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      isLoadingRef.current = false
    }
  }, [])

  // Listen to Supabase auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await loadUser()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Listen to eDepot session changes (via storage events)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edepot_session' || e.key === 'edepot_user') {
        loadUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser
  }
}

export default useEDepotAuth