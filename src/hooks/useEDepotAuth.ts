'use client'

import { useState, useEffect, useCallback } from 'react'
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

export function useEDepotAuth(): UseEDepotAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // First, check Supabase authentication
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      
      if (supabaseUser) {
        // Get Supabase user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single()

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          fullName: profile?.full_name || supabaseUser.user_metadata?.full_name,
          role: profile?.role,
          organizationId: profile?.organization_id,
          organizationName: profile?.organization_name,
          source: 'supabase',
          supabaseUser
        })
        return
      }

      // If no Supabase user, check eDepot session
      const eDepotSession = await hybridAuthService.getEDepotUserSession()
      
      if (eDepotSession) {
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
        return
      }

      // No authentication found
      setUser(null)
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Logout from Supabase if authenticated
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser) {
        await supabase.auth.signOut()
      }
      
      // Clear eDepot session
      await hybridAuthService.clearEDepotSession()
      
      setUser(null)
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const refreshUser = useCallback(async () => {
    await loadUser()
  }, [loadUser])

  // Load user on mount
  useEffect(() => {
    loadUser()
  }, [loadUser])

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
  }, [supabase, loadUser])

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
  }, [loadUser])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser
  }
}

export default useEDepotAuth