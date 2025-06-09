'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

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
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async () => {
    try {
      const supabase = createClient()
      
      // Bước 1: Xử lý tổ chức
      let organizationId: string
      
      // Kiểm tra xem tổ chức đã tồn tại chưa
      const { data: existingOrg, error: orgCheckError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', formData.companyName)
        .single()

      if (orgCheckError && orgCheckError.code !== 'PGRST116') {
        throw orgCheckError
      }

      if (existingOrg) {
        organizationId = existingOrg.id
      } else {
        // Tạo tổ chức mới
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.companyName,
            type: formData.organizationType
          })
          .select('id')
          .single()

        if (orgError) throw orgError
        organizationId = newOrg.id
      }

      // Bước 2: Đăng ký người dùng
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            organization_id: organizationId,
            role: formData.organizationType === 'TRUCKING_COMPANY' ? 'DISPATCHER' : 'CARRIER_ADMIN'
          }
        }
      })

      if (error) throw error

      // Thành công - AuthGuard sẽ tự động redirect
      console.log('Đăng ký thành công!')
      
    } catch (error: any) {
      console.error('Lỗi đăng ký:', error)
      if (error.message?.includes('already registered')) {
        setErrorMessage('Email này đã được sử dụng. Vui lòng thử lại.')
      } else {
        setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    // Validation
    if (!formData.fullName || !formData.companyName || !formData.email || !formData.password) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin.')
      setIsLoading(false)
      return
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
    <Card className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <CardHeader className="text-center pb-8">
        <div className="mx-auto mb-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">iC</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Tạo Tài Khoản Mới</h1>
        <p className="text-text-secondary">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
            Đăng nhập ngay
          </Link>
        </p>
      </CardHeader>
      
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Họ và Tên */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-text-primary">
              Họ và Tên
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Nguyễn Văn A"
              className="border-border focus:border-primary"
              required
            />
          </div>

          {/* Tên Công ty */}
          <div className="space-y-2">
            <label htmlFor="companyName" className="text-sm font-medium text-text-primary">
              Tên Công ty / Tổ chức
            </label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Công ty Vận tải Toàn Thắng"
              className="border-border focus:border-primary"
              required
            />
          </div>

          {/* Loại Hình Tổ Chức */}
          <div className="space-y-2">
            <label htmlFor="organizationType" className="text-sm font-medium text-text-primary">
              Loại hình tổ chức
            </label>
            <select
              id="organizationType"
              name="organizationType"
              value={formData.organizationType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            >
              <option value="TRUCKING_COMPANY">Công ty Vận tải</option>
              <option value="SHIPPING_LINE">Hãng tàu</option>
            </select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-text-primary">
              Địa chỉ email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@congty.com"
              className="border-border focus:border-primary"
              required
            />
          </div>

          {/* Mật khẩu */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-text-primary">
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
                className="border-border focus:border-primary pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3"
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
  )
} 