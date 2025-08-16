'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { LtaLoadingFullscreen } from '@/components/ui/ltaloading'

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
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't do anything while still loading
    if (isLoading) {
      console.log('AuthGuard: Still loading authentication...')
      return
    }

    console.log('AuthGuard: Authentication check complete', {
      requireAuth,
      isAuthenticated,
      userRole: user?.role,
      currentPath: window.location.pathname
    })

    if (requireAuth && !isAuthenticated) {
      console.log('AuthGuard: Redirecting to login (no user, auth required)')
      router.push(redirectTo)
    } else if (!requireAuth && isAuthenticated && user && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
      console.log('AuthGuard: User found on auth page, redirecting to dashboard based on role:', user.role)
      
      // Redirect based on user role
      switch (user.role) {
        case 'DISPATCHER':
          router.push('/dispatcher')
          break
        case 'CARRIER_ADMIN':
          router.push('/carrier-admin')
          break
        default:
          router.push('/reports')
      }
    }
  }, [isLoading, isAuthenticated, user, requireAuth, redirectTo, router])

  if (isLoading) {
    return <LtaLoadingFullscreen text="Đang xác thực..." />
  }

  if (requireAuth && !isAuthenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}