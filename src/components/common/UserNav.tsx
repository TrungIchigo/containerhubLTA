'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User as UserIcon, Settings } from 'lucide-react'
import LogoutConfirmationDialog from '@/components/auth/LogoutConfirmationDialog'

interface UserProfile {
  full_name: string | null
  organization?: {
    name: string
  }
}

export default function UserNav() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUser(user)
          
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select(`
              full_name,
              organization:organizations(name)
            `)
            .eq('id', user.id)
            .single()
          
          if (profileData) {
            setProfile({
              full_name: profileData.full_name,
              organization: Array.isArray(profileData.organization) 
                ? profileData.organization[0] 
                : profileData.organization
            })
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center space-x-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center space-x-2 h-auto p-2 hover:bg-primary hover:text-primary-foreground"
          >
            <UserIcon className="h-4 w-4 text-text-secondary" />
            <div className="text-sm text-left">
              <div className="text-text-primary font-medium">
                {profile?.full_name || 'User'}
              </div>
              {profile?.organization && (
                <div className="text-xs text-text-secondary">
                  {profile.organization.name}
                </div>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              <span>Quản lý Tài khoản</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogoutClick} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog 
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      />
    </div>
  )
} 