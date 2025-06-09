'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogin = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error

      // Lấy thông tin user profile để redirect đúng dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user?.id)
        .single()

      // AuthGuard sẽ handle redirect, nhưng ta có thể manual redirect dựa trên role
      if (profile?.role === 'DISPATCHER') {
        router.push('/dispatcher')
      } else if (profile?.role === 'CARRIER_ADMIN') {
        router.push('/carrier-admin')
      } else {
        router.push('/dashboard')
      }
      
    } catch (error: any) {
      console.error('Lỗi đăng nhập:', error)
      setErrorMessage('Email hoặc mật khẩu không chính xác.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    // Validation
    if (!formData.email || !formData.password) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin.')
      setIsLoading(false)
      return
    }

    await handleLogin()
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
        <h1 className="text-2xl font-bold text-text-primary mb-2">Đăng Nhập</h1>
        <p className="text-text-secondary">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-primary hover:text-primary-dark font-medium">
            Tạo tài khoản mới
          </Link>
        </p>
      </CardHeader>
      
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Nút Đăng Nhập */}
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
              'Đăng Nhập'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 