'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { LOGO_URL } from '@/lib/constants'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    // Validation
    if (!email) {
      setErrorMessage('Vui lòng nhập địa chỉ email.')
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('Email không đúng định dạng.')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setIsEmailSent(true)
    } catch (error: any) {
      console.error('Lỗi gửi email reset:', error)
      if (error.message?.includes('Email not found')) {
        setErrorMessage('Không tìm thấy tài khoản với email này.')
      } else {
        setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại sau.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">Email đã được gửi!</h1>
          <p className="text-text-secondary">
            Chúng tôi đã gửi link đặt lại mật khẩu đến email{' '}
            <span className="font-medium text-text-primary">{email}</span>
          </p>
        </CardHeader>
        
        <CardContent className="px-6 pb-6">
          <div className="space-y-4 text-center">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-800">
                Vui lòng kiểm tra hộp thư (kể cả thư mục spam) và nhấp vào link để đặt lại mật khẩu.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại đăng nhập
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEmailSent(false)
                  setEmail('')
                }}
                className="w-full text-sm"
              >
                Gửi lại email khác
              </Button>
            </div>
          </div>
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
        <h1 className="text-2xl font-bold text-text-primary mb-2">Quên Mật Khẩu</h1>
        <p className="text-text-secondary">
          Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
        </p>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="form-label">
              Địa chỉ email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dispatcher@vantai-abc.com"
              className="form-input"
              required
            />
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
                  Đang gửi...
                </>
              ) : (
                'Gửi Link Đặt Lại Mật Khẩu'
              )}
            </Button>
            
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 