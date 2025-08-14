'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Building2, Shield } from 'lucide-react'

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

interface ProfileSidebarProps {
  profile: UserProfile
  activeTab: string
  onTabChange: (tab: string) => void
}

/**
 * Component hiển thị sidebar với thông tin profile và menu điều hướng
 * @param profile - Thông tin profile của người dùng
 * @param activeTab - Tab hiện tại đang được chọn
 * @param onTabChange - Callback khi thay đổi tab
 */
export function ProfileSidebar({ profile, activeTab, onTabChange }: ProfileSidebarProps) {
  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'DISPATCHER':
        return 'default'
      case 'CARRIER_ADMIN':
        return 'secondary'
      case 'PLATFORM_ADMIN':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'DISPATCHER':
        return 'Điều phối viên'
      case 'CARRIER_ADMIN':
        return 'Carrier Admin'
      case 'PLATFORM_ADMIN':
        return 'Platform Admin'
      default:
        return role
    }
  }

  const menuItems = [
    {
      id: 'profile',
      label: 'Hồ sơ',
      icon: User
    },
    {
      id: 'organization',
      label: 'Thông tin Tổ chức',
      icon: Building2
    },
    {
      id: 'security',
      label: 'Bảo mật & Đăng nhập',
      icon: Shield
    }
  ]

  return (
    <Card className="h-fit">
      <CardContent className="p-8">
        {/* Avatar & Tên */}
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar className="w-20 h-20 mb-4">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'User'} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold text-text-primary mb-1">
            {profile.full_name || 'Chưa cập nhật tên'}
          </h2>
          
          <p className="text-sm text-text-secondary mb-3">
            {profile.email}
          </p>
        </div>

        {/* Vai trò & Tổ chức */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-center">
            <Badge variant={getRoleBadgeVariant(profile.role)}>
              {getRoleDisplayName(profile.role)}
            </Badge>
          </div>
          
          {profile.organization && (
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">
                {profile.organization.name}
              </p>
            </div>
          )}
        </div>

        {/* Menu Điều hướng Phụ */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}