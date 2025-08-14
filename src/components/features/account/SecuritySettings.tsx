'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { changeUserPassword } from '@/lib/actions/account'
import { Shield, Eye, EyeOff, Link, AlertCircle } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { createClient } from '@/lib/supabase/client'

interface SecuritySettingsProps {
  userEmail: string
}

/**
 * Component quản lý cài đặt bảo mật và đăng nhập
 * @param userEmail - Email của người dùng hiện tại
 */
export function SecuritySettings({ userEmail }: SecuritySettingsProps) {
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isValidatingPassword, setIsValidatingPassword] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')  
  // Debounce current password validation
  const debouncedCurrentPassword = useDebounce(currentPassword, 500)
  
  // Validate current password
  useEffect(() => {
    if (debouncedCurrentPassword && debouncedCurrentPassword.length >= 6) {
      validateCurrentPassword(debouncedCurrentPassword)
    } else {
      setCurrentPasswordError('')
    }
  }, [debouncedCurrentPassword])
  
  // Validate new password
  useEffect(() => {
    if (newPassword) {
      if (newPassword.length < 6) {
        setNewPasswordError('Mật khẩu phải có ít nhất 6 ký tự')
      } else if (newPassword === currentPassword) {
        setNewPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại')
      } else {
        setNewPasswordError('')
      }
    } else {
      setNewPasswordError('')
    }
  }, [newPassword, currentPassword])
  
  // Validate confirm password
  useEffect(() => {
    if (confirmPassword) {
      if (confirmPassword !== newPassword) {
        setConfirmPasswordError('Mật khẩu xác nhận không khớp')
      } else {
        setConfirmPasswordError('')
      }
    } else {
      setConfirmPasswordError('')
    }
  }, [confirmPassword, newPassword])

  /**
   * Kiểm tra mật khẩu hiện tại có đúng không
   */
  const validateCurrentPassword = async (password: string) => {
    setIsValidatingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      })
      
      if (error) {
        setCurrentPasswordError('Mật khẩu hiện tại không đúng')
      } else {
        setCurrentPasswordError('')
      }
    } catch (error) {
      console.error('Error validating password:', error)
      setCurrentPasswordError('Có lỗi xảy ra khi kiểm tra mật khẩu')
    } finally {
      setIsValidatingPassword(false)
    }
  }

  /**
   * Xử lý thay đổi mật khẩu
   */
  const handleChangePassword = async () => {
    // Validate form
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "❌ Lỗi!",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      })
      return
    }
    
    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      toast({
        title: "❌ Lỗi!",
        description: "Vui lòng sửa các lỗi trong form",
        variant: "destructive"
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changeUserPassword({
        currentPassword,
        newPassword
      })
      
      if (result.success) {
        toast({
          title: "✅ Thành công!",
          description: result.message,
          className: "bg-green-50 border-green-200 text-green-800"
        })
        
        // Reset form
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
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
      setIsChangingPassword(false)
    }
  }

  /**
   * Xử lý liên kết tài khoản eDepot (placeholder)
   */
  const handleLinkEDepot = () => {
    toast({
      title: "🚧 Tính năng đang phát triển",
      description: "Tính năng liên kết tài khoản eDepot sẽ được bổ sung trong phiên bản tiếp theo",
      className: "bg-blue-50 border-blue-200 text-blue-800"
    })
  }

  const canChangePassword = currentPassword && newPassword && confirmPassword && 
    !currentPasswordError && !newPasswordError && !confirmPasswordError && !isValidatingPassword

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <Card>
        <CardHeader className="pb-4 pt-4 pl-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Thay đổi mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-8 pb-8">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className={`pr-10 ${currentPasswordError ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isValidatingPassword && (
              <p className="text-xs text-blue-600">Đang kiểm tra mật khẩu...</p>
            )}
            {currentPasswordError && (
              <p className="text-xs text-red-600">{currentPasswordError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                className={`pr-10 ${newPasswordError ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {newPasswordError && (
              <p className="text-xs text-red-600">{newPasswordError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className={`pr-10 ${confirmPasswordError ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {confirmPasswordError && (
              <p className="text-xs text-red-600">{confirmPasswordError}</p>
            )}
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={handleChangePassword}
              disabled={!canChangePassword || isChangingPassword}
              className="bg-primary hover:bg-primary/90"
            >
              {isChangingPassword ? 'Đang thay đổi...' : 'Thay đổi mật khẩu'}
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}