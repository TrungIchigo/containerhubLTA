'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) {
      console.log('HomePage: Still loading authentication...')
      return
    }

    console.log('HomePage: Authentication check complete', {
      isAuthenticated,
      userRole: user?.role,
      userSource: user?.source
    })

    if (isAuthenticated && user) {
      console.log('HomePage: User authenticated, redirecting based on role:', user.role)
      
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
    } else {
      console.log('HomePage: No authenticated user, redirecting to login')
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, user, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}