'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get user profile to determine appropriate page
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          if (profile) {
            switch (profile.role) {
              case 'DISPATCHER':
                router.push('/dispatcher')
                break
              case 'CARRIER_ADMIN':
                router.push('/carrier-admin')
                break
              default:
                router.push('/dashboard')
            }
          } else {
            router.push('/dashboard')
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking user:', error)
        // If there's an error (like missing env vars), redirect to login
        router.push('/login')
      }
    }

    checkUser()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}