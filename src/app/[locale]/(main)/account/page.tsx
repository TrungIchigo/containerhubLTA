'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { updateUserProfile, changeUserPassword, validateCurrentPassword } from '@/lib/actions/account'

interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: string
  organization?: {
    name: string
  }
}

// Custom hook for debounced value
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  // Profile form state
  const [fullName, setFullName] = useState('')
  const [isProfileChanged, setIsProfileChanged] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  
  // Security form state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [isValidatingCurrentPassword, setIsValidatingCurrentPassword] = useState(false)
  const [currentPasswordValid, setCurrentPasswordValid] = useState(false)

  // Debounce current password for validation
  const debouncedCurrentPassword = useDebounce(currentPassword, 1000)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          setUser(authUser)
          
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              role,
              organization:organizations(name)
            `)
            .eq('id', authUser.id)
            .single()
          
          if (profileData) {
            const userProfile = {
              id: profileData.id,
              full_name: profileData.full_name,
              email: authUser.email || '',
              role: profileData.role,
              organization: Array.isArray(profileData.organization) 
                ? profileData.organization[0] 
                : profileData.organization
            }
            setProfile(userProfile)
            setFullName(userProfile.full_name || '')
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

  // Check if profile form has changes
  useEffect(() => {
    if (profile) {
      setIsProfileChanged(fullName !== (profile.full_name || ''))
    }
  }, [fullName, profile])

  // Realtime password confirmation validation
  useEffect(() => {
    if (confirmNewPassword && newPassword) {
      if (confirmNewPassword !== newPassword) {
        setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới')
      } else {
        setPasswordError('')
      }
    } else {
      setPasswordError('')
    }
  }, [newPassword, confirmNewPassword])

  // Debounced current password validation
  useEffect(() => {
    const validateCurrentPass = async () => {
      if (debouncedCurrentPassword && debouncedCurrentPassword.length >= 6) {
        setIsValidatingCurrentPassword(true)
        try {
          const result = await validateCurrentPassword(debouncedCurrentPassword)
          if (result.success) {
            setCurrentPasswordError('')
            setCurrentPasswordValid(true)
          } else {
            setCurrentPasswordError(result.error || 'Có lỗi xảy ra')
            setCurrentPasswordValid(false)
          }
        } catch (error) {
          setCurrentPasswordError('Không thể xác thực mật khẩu')
          setCurrentPasswordValid(false)
        } finally {
          setIsValidatingCurrentPassword(false)
        }
      } else if (debouncedCurrentPassword) {
        setCurrentPasswordError('')
        setCurrentPasswordValid(false)
      } else {
        setCurrentPasswordError('')
        setCurrentPasswordValid(false)
      }
    }

    validateCurrentPass()
  }, [debouncedCurrentPassword])

  const handleUpdateProfile = async () => {
    if (!profile || !isProfileChanged) return

    setIsUpdatingProfile(true)
    try {
      const result = await updateUserProfile(fullName)
      
      if (result.success) {
        toast({
          title: "✅ Thành công!",
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-800"
        })
        setProfile({ ...profile, full_name: fullName })
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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: "❌ Lỗi!",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      })
      return
    }

    if (!currentPasswordValid) {
      toast({
        title: "❌ Lỗi!",
        description: "Mật khẩu hiện tại không chính xác",
        variant: "destructive"
      })
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "❌ Lỗi!",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "❌ Lỗi!",
        description: "Mật khẩu mới phải có ít nhất 8 ký tự",
        variant: "destructive"
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const result = await changeUserPassword(currentPassword, newPassword)
      
      if (result.success) {
        toast({
          title: "✅ Thành công!",
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-800"
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setPasswordError('')
        setCurrentPasswordError('')
        setCurrentPasswordValid(false)
      } else {
        toast({
          title: "❌ Lỗi!",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "❌ Lỗi!",
        description: "Có lỗi xảy ra khi thay đổi mật khẩu",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <div className="animate-pulse h-8 w-48 mb-2 bg-gray-200 rounded"></div>
          <div className="animate-pulse h-4 w-72 bg-gray-200 rounded"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="animate-pulse h-6 w-32 bg-gray-200 rounded"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="animate-pulse h-10 w-full bg-gray-200 rounded"></div>
            <div className="animate-pulse h-10 w-full bg-gray-200 rounded"></div>
            <div className="animate-pulse h-10 w-full bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Quản lý tài khoản</h1>
        <p className="text-text-secondary">Cập nhật thông tin cá nhân và cài đặt bảo mật</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và Tên</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Không thể thay đổi email đăng nhập
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organization">Tên Công ty/Tổ chức</Label>
                <Input
                  id="organization"
                  value={profile?.organization?.name || 'Chưa có thông tin'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <Button 
                onClick={handleUpdateProfile}
                disabled={!isProfileChanged || isUpdatingProfile}
                className="bg-primary hover:bg-primary/90"
              >
                {isUpdatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Thay đổi mật khẩu</CardTitle>
              <CardDescription>
                Cập nhật mật khẩu để đảm bảo an toàn tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={
                      currentPasswordError 
                        ? 'border-red-500 pr-10' 
                        : currentPasswordValid 
                          ? 'border-green-500 pr-10' 
                          : ''
                    }
                  />
                  {isValidatingCurrentPassword && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {!isValidatingCurrentPassword && currentPassword && !currentPasswordError && currentPasswordValid && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      ✅
                    </div>
                  )}
                </div>
                {currentPasswordError && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {currentPasswordError}
                  </p>
                )}
                {!currentPasswordError && currentPasswordValid && (
                  <p className="text-sm text-green-600 flex items-center">
                    <span className="mr-1">✅</span>
                    Mật khẩu chính xác
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className={passwordError ? 'border-red-500' : ''}
                />
                {passwordError && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {passwordError}
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleChangePassword}
                disabled={isUpdatingPassword || !!passwordError || !currentPasswordValid}
                className="bg-primary hover:bg-primary/90"
              >
                {isUpdatingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 