'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import UserNav from './UserNav'
import GlobalSearchCommand from './GlobalSearchCommand'
import { LOGO_URL, APP_CONFIG, ROUTES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [userRole, setUserRole] = useState<string>('DISPATCHER')

  useEffect(() => {
    // Get user role for search component using client-side Supabase
    const getUserRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (profile?.role) {
            setUserRole(profile.role)
          }
        }
      } catch (error) {
        console.error('Error getting user role:', error)
        setUserRole('DISPATCHER')
      }
    }

    getUserRole()
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-6">
        {/* Logo and Brand */}
        <Link href={ROUTES.DASHBOARD} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <Image
            src={LOGO_URL}
            alt="i-ContainerHub Logo"
            width={60}
            height={60}
            className="rounded-full"
            priority
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-primary">{APP_CONFIG.name}</h1>
            <p className="text-xs text-text-secondary">Logistics Technology Application</p>
          </div>
        </Link>

        {/* Right Side - Search and User Navigation */}
        <div className="flex items-center gap-4">
          {/* Global Search - Moved to right side */}
          <div className="hidden md:flex">
            <GlobalSearchCommand userRole={userRole} />
          </div>

          {/* User Navigation */}
          <UserNav />
        </div>
      </div>
    </header>
  )
} 