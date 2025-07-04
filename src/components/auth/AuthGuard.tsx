'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Loading } from '@/components/ui/loader'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function AuthGuard({ 
  children, 
  requireAuth = false, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (requireAuth && !user) {
          router.push(redirectTo)
        } else if (!requireAuth && user && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
          // Get user profile to redirect to correct dashboard
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (profile?.role === 'DISPATCHER') {
            router.push('/dispatcher')
          } else if (profile?.role === 'CARRIER_ADMIN') {
            router.push('/carrier-admin')
          } else {
            router.push('/dashboard')
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event: any, session: any) => {
            if (event === 'SIGNED_IN') {
              setUser(session?.user ?? null)
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
              if (requireAuth) {
                router.push(redirectTo)
              }
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error checking user:', error)
        if (requireAuth) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [router, requireAuth, redirectTo])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading text="Đang xác thực..." />
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // Will redirect
  }

  return <>{children}</>
} 