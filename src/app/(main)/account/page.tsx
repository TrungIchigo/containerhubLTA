'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { ProfileSidebar, AccountDetails, OrganizationDetails, SecuritySettings } from '@/components/features/account'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: string
  avatar_url?: string | null
  phone_number?: string | null
  organization?: {
    name: string
    tax_code?: string
    address?: string
    phone_number?: string
    status?: string
  }
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const { toast } = useToast()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          setUser(authUser)
          
          // Get user profile with organization details
          const { data: profileData } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              role,
              avatar_url,
              phone_number,
              organization:organizations(
                name,
                tax_code,
                address,
                phone_number,
                status
              )
            `)
            .eq('id', authUser.id)
            .single()
          
          if (profileData) {
            const userProfile: UserProfile = {
              id: profileData.id,
              full_name: profileData.full_name,
              email: authUser.email || '',
              role: profileData.role,
              avatar_url: profileData.avatar_url,
              phone_number: profileData.phone_number,
              organization: Array.isArray(profileData.organization) 
                ? profileData.organization[0] 
                : profileData.organization
            }
            setProfile(userProfile)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  /**
   * Callback khi profile được cập nhật từ AccountDetails component
   */
  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile)
  }

  /**
   * Callback khi thay đổi tab từ ProfileSidebar
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  /**
   * Render component tương ứng với tab được chọn
   */
  const renderActiveTabContent = () => {
    if (!profile) return null

    switch (activeTab) {
      case 'profile':
        return (
          <AccountDetails 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate}
          />
        )
      case 'organization':
        return <OrganizationDetails profile={profile} />
      case 'security':
        return <SecuritySettings userEmail={profile.email} />
      default:
        return (
          <AccountDetails 
            profile={profile} 
            onProfileUpdate={handleProfileUpdate}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <div className="animate-pulse h-8 w-48 mb-2 bg-gray-200 rounded"></div>
          <div className="animate-pulse h-4 w-72 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
          </div>
          {/* Content Skeleton */}
          <div className="lg:col-span-2">
            <div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-text-secondary">Không thể tải thông tin tài khoản</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Quản lý tài khoản</h1>
        <p className="text-text-secondary">Cập nhật thông tin cá nhân và cài đặt bảo mật</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          <ProfileSidebar 
            profile={profile}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
        
        {/* Right Content - 2/3 width */}
        <div className="lg:col-span-2">
          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  )
}