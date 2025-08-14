'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { updateUserProfile } from '@/lib/actions/account'
import { Upload, User } from 'lucide-react'

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

interface AccountDetailsProps {
  profile: UserProfile
  onProfileUpdate: (updatedProfile: UserProfile) => void
}

/**
 * Component hiển thị và cho phép chỉnh sửa thông tin cá nhân
 * @param profile - Thông tin profile hiện tại
 * @param onProfileUpdate - Callback khi profile được cập nhật
 */
export function AccountDetails({ profile, onProfileUpdate }: AccountDetailsProps) {
  const { toast } = useToast()
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [isProfileChanged, setIsProfileChanged] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Kiểm tra xem form có thay đổi không
  useEffect(() => {
    const hasChanges = 
      fullName !== (profile.full_name || '') ||
      phoneNumber !== (profile.phone_number || '') ||
      avatarUrl !== (profile.avatar_url || '')
    
    setIsProfileChanged(hasChanges)
  }, [fullName, phoneNumber, avatarUrl, profile])

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Xử lý cập nhật thông tin profile
   */
  const handleUpdateProfile = async () => {
    if (!isProfileChanged) return

    setIsUpdatingProfile(true)
    try {
      const result = await updateUserProfile({
        full_name: fullName.trim() || null,
        phone_number: phoneNumber.trim() || null,
        avatar_url: avatarUrl.trim() || null
      })
      
      if (result.success) {
        toast({
          title: "✅ Thành công!",
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-800"
        })
        
        // Cập nhật profile trong parent component
        const updatedProfile = {
          ...profile,
          full_name: fullName.trim() || null,
          phone_number: phoneNumber.trim() || null,
          avatar_url: avatarUrl.trim() || null
        }
        onProfileUpdate(updatedProfile)
        setIsProfileChanged(false)
      } else {
        toast({
          title: "❌ Lỗi!",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "❌ Lỗi!",
        description: "Có lỗi xảy ra khi cập nhật thông tin",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  /**
   * Xử lý upload avatar (placeholder - cần implement upload logic)
   */
  const handleAvatarUpload = () => {
    // TODO: Implement avatar upload logic
    toast({
      title: "🚧 Tính năng đang phát triển",
      description: "Tính năng upload avatar sẽ được bổ sung trong phiên bản tiếp theo",
      className: "bg-blue-50 border-blue-200 text-blue-800"
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4 pt-4 pl-3">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Thông tin cá nhân
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <Avatar className="w-20 h-20">
            <AvatarImage src={avatarUrl || undefined} alt={fullName || 'User'} />
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAvatarUpload}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Thay đổi ảnh đại diện
            </Button>
            <p className="text-xs text-muted-foreground">
              Định dạng: JPG, PNG. Kích thước tối đa: 2MB
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid gap-6">
          <div className="space-y-3 space-x-4">
            <Label htmlFor="fullName" className="text-sm font-medium">Họ và Tên *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên của bạn"
              className="max-w-md"
            />
          </div>
          
          <div className="space-y-3 space-x-4">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">Số điện thoại</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Nhập số điện thoại"
              className="max-w-md"
            />
          </div>
          
          <div className="space-y-3 space-x-4">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-gray-50 max-w-md"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Không thể thay đổi email đăng nhập
            </p>
          </div>


        </div>
        
        {/* Action Button */}
        <div className="pt-4">
          <Button 
            onClick={handleUpdateProfile}
            disabled={!isProfileChanged || isUpdatingProfile}
            className="bg-primary hover:bg-primary/90"
          >
            {isUpdatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}