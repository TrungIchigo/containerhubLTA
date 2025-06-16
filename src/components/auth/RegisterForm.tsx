'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { LOGO_URL } from '@/lib/constants'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    organizationType: 'TRUCKING_COMPANY',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, organizationType: value }))
  }

  const handleRegister = async () => {
    try {
      setDebugInfo('Starting registration process...')
      const supabase = createClient()
      
      // Test permissions first
      setDebugInfo('Testing database permissions...')
      const { data: testData, error: testError } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1)

      if (testError) {
        console.error('Permission test failed:', testError)
        throw new Error(`Database permission error: ${testError.message}`)
      }

      setDebugInfo('Permissions OK. Checking organization...')
      
      // Bước 1: Xử lý tổ chức
      let organizationId: string
      
      // Kiểm tra xem tổ chức đã tồn tại chưa
      const { data: existingOrg, error: orgCheckError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', formData.companyName)
        .single()

      if (orgCheckError && orgCheckError.code !== 'PGRST116') {
        console.error('Organization check error:', orgCheckError)
        throw new Error(`Organization check failed: ${orgCheckError.message}`)
      }

      if (existingOrg) {
        organizationId = existingOrg.id
        setDebugInfo(`Found existing organization: ${organizationId}`)
      } else {
        setDebugInfo('Creating new organization...')
        // Tạo tổ chức mới
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.companyName,
            type: formData.organizationType
          })
          .select('id')
          .single()

        if (orgError) {
          console.error('Organization creation error:', orgError)
          throw new Error(`Failed to create organization: ${orgError.message}`)
        }
        organizationId = newOrg.id
        setDebugInfo(`Created new organization: ${organizationId}`)
      }

      // Email validation and normalization
      const normalizedEmail = formData.email.toLowerCase().trim()
      setDebugInfo(`Using email: ${normalizedEmail}`)

      // Bước 2: Đăng ký người dùng - disable email confirmation for testing
      setDebugInfo('Creating user account...')
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation redirect
          data: {
            full_name: formData.fullName,
            organization_id: organizationId,
            role: formData.organizationType === 'TRUCKING_COMPANY' ? 'DISPATCHER' : 'CARRIER_ADMIN'
          }
        }
      })

      if (error) {
        console.error('User creation error:', error)
        setDebugInfo(`Auth error: ${error.message}`)
        
        // Handle specific Supabase auth errors
        if (error.message?.includes('Email not confirmed')) {
          throw new Error('Email cần được xác nhận. Vui lòng kiểm tra hộp thư của bạn.')
        } else if (error.message?.includes('invalid_email') || error.message?.includes('Email address') && error.message?.includes('invalid')) {
          throw new Error('Email không hợp lệ. Vui lòng sử dụng email cá nhân (ví dụ: example@gmail.com)')
        } else {
          throw error
        }
      }

      if (!data.user) {
        throw new Error('User creation failed - no user returned')
      }

      setDebugInfo(`User created: ${data.user.id}. Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)

      // Bước 3: Manual profile creation (fallback)
      setDebugInfo('Creating profile...')
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: formData.fullName,
          organization_id: organizationId,
          role: formData.organizationType === 'TRUCKING_COMPANY' ? 'DISPATCHER' : 'CARRIER_ADMIN'
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        setDebugInfo(`Profile creation failed: ${profileError.message}`)
        // Don't throw - user is already created
      } else {
        setDebugInfo('Profile created successfully')
      }

      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        setDebugInfo('Email confirmation required - check your email')
        setErrorMessage('Tài khoản đã được tạo! Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.')
        return
      }

      // Thành công - hiển thị popup và countdown
      setDebugInfo('Registration completed successfully!')
      setShowSuccessModal(true)
      
      // Bắt đầu countdown
      const redirectPath = formData.organizationType === 'TRUCKING_COMPANY' ? '/dispatcher' : '/carrier-admin'
      
      let timeLeft = 3
      const countdownInterval = setInterval(() => {
        timeLeft -= 1
        setCountdown(timeLeft)
        
        if (timeLeft === 0) {
          clearInterval(countdownInterval)
          router.push(redirectPath)
        }
      }, 1000)
      
    } catch (error: any) {
      console.error('Registration error:', error)
      setDebugInfo(`Error: ${error.message}`)
      
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        setErrorMessage('Email này đã được sử dụng. Vui lòng sử dụng email khác.')
      } else if (error.message?.includes('weak_password')) {
        setErrorMessage('Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn (ít nhất 6 ký tự).')
      } else if (error.message?.includes('invalid_email') || error.message?.includes('Email address') && error.message?.includes('invalid')) {
        setErrorMessage('Email không hợp lệ. Vui lòng sử dụng email từ nhà cung cấp phổ biến (Gmail, Outlook, Yahoo, etc.)')
      } else if (error.message?.includes('Email not confirmed')) {
        setErrorMessage('Vui lòng xác nhận email trước khi tiếp tục.')
      } else {
        setErrorMessage(`Lỗi đăng ký: ${error.message}`)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    setDebugInfo('')

    // Enhanced validation
    if (!formData.fullName || !formData.companyName || !formData.email || !formData.password) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin.')
      setIsLoading(false)
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Email không đúng định dạng. Vui lòng nhập email hợp lệ.')
      setIsLoading(false)
      return
    }

    // Suggest using common email providers for better compatibility
    const commonProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com']
    const emailDomain = formData.email.split('@')[1]?.toLowerCase()
    if (emailDomain && !commonProviders.includes(emailDomain)) {
      setDebugInfo(`Đang sử dụng email domain: ${emailDomain}. Nếu gặp lỗi, hãy thử với Gmail/Outlook.`)
    }

    if (formData.password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.')
      setIsLoading(false)
      return
    }

    await handleRegister()
    setIsLoading(false)
  }

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center shadow-xl">
            <div className="mb-4">
              <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Đăng ký thành công!</h3>
              <div className="text-sm text-text-secondary space-y-1">
                <p><strong>Họ tên:</strong> {formData.fullName}</p>
                <p><strong>Công ty:</strong> {formData.companyName}</p>
                <p><strong>Loại hình:</strong> {formData.organizationType === 'TRUCKING_COMPANY' ? 'Công ty Vận tải' : 'Hãng tàu'}</p>
                <p><strong>Email:</strong> {formData.email}</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Đang chuyển hướng trong <span className="font-semibold text-primary">{countdown}</span> giây...
            </p>
          </div>
        </div>
      )}

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
        <h1 className="text-2xl font-bold text-text-primary mb-2">Tạo Tài Khoản Mới</h1>
        <p className="text-text-secondary">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
            Đăng nhập ngay
          </Link>
        </p>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Họ và Tên */}
          <div>
            <label htmlFor="fullName" className="form-label">
              Họ và Tên
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Nguyễn Văn A"
              className="form-input"
              required
            />
          </div>

          {/* Tên Công ty */}
          <div>
            <label htmlFor="companyName" className="form-label">
              Tên Công ty / Tổ chức
            </label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Công ty Vận tải ABC"
              className="form-input"
              required
            />
          </div>

          {/* Loại Hình Tổ Chức */}
          <div>
            <label className="form-label">
              Loại hình tổ chức
            </label>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="organizationType"
                  value="TRUCKING_COMPANY"
                  checked={formData.organizationType === 'TRUCKING_COMPANY'}
                  onChange={() => handleRadioChange('TRUCKING_COMPANY')}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-text-primary">Công ty Vận tải</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="organizationType"
                  value="SHIPPING_LINE"
                  checked={formData.organizationType === 'SHIPPING_LINE'}
                  onChange={() => handleRadioChange('SHIPPING_LINE')}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-text-primary">Hãng tàu</span>
              </label>
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="form-label">
              Địa chỉ email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="dispatcher@vantai-abc.com"
              className="form-input"
              required
            />
          </div>

          {/* Mật khẩu */}
          <div>
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
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

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="p-3 text-sm text-danger bg-red-50 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}

          {/* Nút Đăng Ký */}
          <Button 
            type="submit" 
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Đăng Ký'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
    </>
  )
} 