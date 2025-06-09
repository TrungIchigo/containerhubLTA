'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { LogOut, User as UserIcon } from 'lucide-react'

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

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
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
      <div className="flex items-center space-x-2">
        <UserIcon className="h-4 w-4 text-text-secondary" />
        <div className="text-sm">
          <div className="text-text-primary font-medium">
            {profile?.full_name || 'User'}
          </div>
          {profile?.organization && (
            <div className="text-xs text-text-secondary">
              {profile.organization.name}
            </div>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="text-sm"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Đăng xuất
      </Button>
    </div>
  )
} 