'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

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
          router.push('/dashboard')
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // Will redirect
  }

  return <>{children}</>
} 