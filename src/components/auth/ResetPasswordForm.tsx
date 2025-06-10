'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { LOGO_URL } from '@/lib/constants'

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have access token in URL or from session
    const handleAuthChange = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // If no session and no access token, redirect to forgot password
        router.push('/forgot-password')
      }
    }

    handleAuthChange()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    // Validation
    if (!password || !confirmPassword) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      console.error('Lỗi đặt lại mật khẩu:', error)
      if (error.message?.includes('session_not_found') || error.message?.includes('invalid_token')) {
        setErrorMessage('Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới.')
      } else {
        setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4">
            <Image
              src={LOGO_URL}
              alt="i-ContainerHub Logo"
              width={200}
              height={200}
              className="rounded-full"
              priority
            />
          </div>
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Đặt lại mật khẩu thành công!</h1>
          <p className="text-text-secondary">
            Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng đến trang đăng nhập...
          </p>
        </CardHeader>
        
        <CardContent className="px-6 pb-6 text-center">
          <Link href="/login">
            <Button className="btn-primary w-full">
              Đăng nhập ngay
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4">
          <Image
            src={LOGO_URL}
            alt="i-ContainerHub Logo"
            width={200}
            height={200}
            className="rounded-full"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Đặt Lại Mật Khẩu</h1>
        <p className="text-text-secondary">
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mật khẩu mới */}
          <div>
            <label htmlFor="password" className="form-label">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="p-3 text-sm text-danger bg-red-50 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <Button 
              type="submit" 
              className="btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập Nhật Mật Khẩu'
              )}
            </Button>
            
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full text-sm">
                Gửi lại link đặt lại mật khẩu
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 