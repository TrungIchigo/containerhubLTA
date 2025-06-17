'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for success message from registration
  useEffect(() => {
    const success = searchParams.get('success')
    const message = searchParams.get('message')
    
    if (success === 'registration' && message) {
      setSuccessMessage(decodeURIComponent(message))
      
      // Clear URL params after showing message
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

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
     <div className="grid gap-8">
       {/* Logo */}
       <div className="flex justify-center">
         <Link href="/">
           <Image
             src="https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets//logo.png"
             alt="i-ContainerHub Logo"
             width={200}
             height={200}
           />
         </Link>
       </div>
       
       <div className="grid gap-3 text-center">
         <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
           Đăng Nhập
         </h1>
         <p className="text-lg text-gray-600">
           Chưa có tài khoản?{" "}
           <Link href="/register" className="font-semibold text-primary hover:text-blue-600 transition-colors">
             Tạo tài khoản mới
           </Link>
         </p>
       </div>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
                     <div className="grid gap-3">
             <Label htmlFor="email" className="text-gray-700 font-medium">Địa chỉ email</Label>
             <Input
               id="email"
               name="email"
               type="email"
               value={formData.email}
               onChange={handleInputChange}
               placeholder="dispatcher@vantai-abc.com"
               className="h-12 border-2 border-gray-200 focus:border-primary focus:ring-primary transition-colors"
               required
             />
           </div>
           <div className="grid gap-3">
             <div className="flex items-center">
               <Label htmlFor="password" className="text-gray-700 font-medium">Mật khẩu</Label>
               <Link href="/forgot-password" className="ml-auto inline-block text-sm text-primary hover:text-blue-600 transition-colors">
                 Quên mật khẩu?
               </Link>
             </div>
             <div className="relative">
               <Input
                 id="password"
                 name="password"
                 type={showPassword ? 'text' : 'password'}
                 value={formData.password}
                 onChange={handleInputChange}
                 placeholder="••••••••"
                 className="h-12 border-2 border-gray-200 focus:border-primary focus:ring-primary transition-colors pr-12"
                 required
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
               >
                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
               </button>
             </div>
           </div>

          {/* Thông báo thành công */}
          {successMessage && (
            <div className="flex items-center gap-3 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="p-3 text-sm text-danger bg-red-50 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}

                     <Button 
             type="submit" 
             className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl" 
             disabled={isLoading}
           >
             {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                 Đang xử lý...
               </>
             ) : (
               'Đăng Nhập'
             )}
           </Button>
        </div>
      </form>
    </div>
  )
} 