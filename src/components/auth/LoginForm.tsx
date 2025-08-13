'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, CheckCircle, Sparkles, Shield, Truck, Container } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { hybridAuthService } from '@/lib/services/hybrid-auth'
import { loginWithEdepot } from '@/lib/actions/edepot-auth'
import { gsap } from 'gsap'
import { LtaLoadingCompact } from '@/components/ui/ltaloading'

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState('supabase')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [edepotFormData, setEdepotFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Refs cho GSAP animations
  const containerRef = useRef<HTMLDivElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const floatingElementsRef = useRef<HTMLDivElement[]>([])

  // Check for success message from registration
  useEffect(() => {
    const success = searchParams?.get('success')
    const message = searchParams?.get('message')
    
    if (success === 'registration' && message) {
      setSuccessMessage(decodeURIComponent(message))
      
      // Clear URL params after showing message
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // GSAP Animations phủ toàn màn hình
  useEffect(() => {
    // Đảm bảo tất cả refs đã được mount
    if (!backgroundRef.current || !logoRef.current || !titleRef.current || !subtitleRef.current || !formRef.current) {
      return
    }

    const tl = gsap.timeline()
    
    // Set initial states với null checks
    if (backgroundRef.current) {
      gsap.set(backgroundRef.current, {
        opacity: 0,
        scale: 1.1
      })
    }
    
    const formElements = [logoRef.current, titleRef.current, subtitleRef.current, formRef.current].filter(Boolean)
    gsap.set(formElements, {
      opacity: 0,
      y: 50,
      scale: 0.8
    })

    // Animated background gradient
    if (backgroundRef.current) {
      tl.to(backgroundRef.current, {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power2.out"
      })
    }

    if (logoRef.current) {
      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.8")
    }

    if (titleRef.current) {
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.4")
    }

    if (subtitleRef.current) {
      tl.to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.5")
    }

    if (formRef.current) {
      tl.to(formRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "power3.out"
      }, "-=0.3")
    }

    // Floating elements animation với logistics icons
    floatingElementsRef.current.forEach((el, index) => {
      if (el) {
        gsap.set(el, {
          rotation: Math.random() * 360,
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
        })
        
        gsap.to(el, {
          rotation: `+=${360 + Math.random() * 360}`,
          duration: 15 + Math.random() * 10,
          repeat: -1,
          ease: "none"
        })
        
        gsap.to(el, {
          y: `+=${Math.random() * 60 - 30}`,
          x: `+=${Math.random() * 40 - 20}`,
          duration: 4 + Math.random() * 3,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut"
        })
      }
    })

    // Cleanup
    return () => {
      tl.kill()
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (activeTab === 'edepot') {
      setEdepotFormData(prev => ({
        ...prev,
        [name]: value
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      let result
      
      if (activeTab === 'edepot') {
        // eDepot login
        result = await loginWithEdepot(edepotFormData.username, edepotFormData.password)
      } else {
        // Supabase login
        result = await hybridAuthService.authenticate({ email: formData.email, password: formData.password })
      }
      
      if (result.success) {
        setSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...')
        
        // Animate success
        if (formRef.current) {
          gsap.to(formRef.current, {
            scale: 1.02,
            duration: 0.3,
            ease: "power2.out",
            yoyo: true,
            repeat: 1
          })
        }
        
        setTimeout(() => {
          router.push(result.redirectTo || '/dashboard')
        }, 1500)
      } else {
        setErrorMessage(result.error || 'Đăng nhập thất bại')
        
        // Animate error
        if (formRef.current) {
          gsap.fromTo(formRef.current, 
            { x: 0 },
            {
              x: 10,
              duration: 0.1,
              yoyo: true,
              repeat: 3,
              ease: "power2.out"
            }
          )
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrorMessage('Có lỗi xảy ra khi đăng nhập')
      
      // Animate error
      if (formRef.current) {
        gsap.fromTo(formRef.current, 
          { x: 0 },
          {
            x: 10,
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            ease: "power2.out"
          }
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-background">
      {/* Animated Background - phủ toàn cột bên trái */}
      <div 
        ref={backgroundRef}
        className="absolute inset-0 bg-gradient-to-br from-background via-primary-light/10 to-background"
      />
      
      {/* Floating Elements - Logistics themed phủ toàn màn hình */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            ref={el => {
              if (el) floatingElementsRef.current[i] = el
            }}
            className="absolute opacity-8 text-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${1 + Math.random() * 1.5}rem`
            }}
          >
            {i % 4 === 0 && <Container />}
            {i % 4 === 1 && <Truck />}
            {i % 4 === 2 && <Shield />}
            {i % 4 === 3 && <Sparkles />}
          </div>
        ))}
      </div>

      {/* Main Form Container - căn giữa trong toàn bộ không gian */}
      <div ref={containerRef} className="relative z-10 flex items-center justify-center w-full h-full min-h-screen p-6">
        <div className="w-full max-w-md">
          <div className="grid gap-8">
            
            {/* Logo với Design System colors */}
            <div ref={logoRef} className="flex justify-center">
              <Link href="/" className="transform hover:scale-105 transition-transform duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                  <Image
                    src="https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets//logo.png"
                    alt="i-ContainerHub Logo"
                    width={120}
                    height={120}
                    className="relative z-10 drop-shadow-lg"
                  />
                </div>
              </Link>
            </div>
            
            {/* Title Section với Green Logistics theme */}
            <div className="grid gap-3 text-center">
              <h1 
                ref={titleRef}
                className="text-4xl font-bold mb-2"
              >
                <span className="bg-gradient-to-r from-primary via-primary-dark to-secondary bg-clip-text text-transparent">
                  Đăng Nhập
                </span>
              </h1>
              <p 
                ref={subtitleRef}
                className="text-lg text-text-secondary"
              >
                Chưa có tài khoản?{" "}
                <Link 
                  href="/register" 
                  className="font-semibold text-primary hover:text-primary-dark transition-colors duration-300 underline decoration-2 underline-offset-4"
                >
                  Tạo tài khoản mới
                </Link>
              </p>
            </div>

            {/* Form với Design System styling */}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* Login Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="supabase">Tài khoản thường</TabsTrigger>
                  <TabsTrigger value="edepot">eDepot</TabsTrigger>
                </TabsList>
                
                <TabsContent value="supabase" className="space-y-6 mt-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-text-primary font-medium text-sm">
                      Địa chỉ email
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="dispatcher@vantai-abc.com"
                        className="h-12 bg-foreground border-border focus:border-primary focus:ring-primary text-text-primary placeholder:text-text-secondary rounded-input transition-all duration-300 hover:border-primary/50"
                        required
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-input pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-text-primary font-medium text-sm">
                        Mật khẩu
                      </Label>
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-primary hover:text-primary-dark transition-colors duration-300"
                      >
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
                        className="h-12 bg-foreground border-border focus:border-primary focus:ring-primary text-text-primary placeholder:text-text-secondary rounded-input transition-all duration-300 hover:border-primary/50 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors duration-300"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-input pointer-events-none"></div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="edepot" className="space-y-6 mt-6">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-text-primary font-medium text-sm">
                      Tên đăng nhập eDepot
                    </Label>
                    <div className="relative">
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        value={edepotFormData.username}
                        onChange={handleInputChange}
                        placeholder="Nhập tên đăng nhập eDepot"
                        className="h-12 bg-foreground border-border focus:border-primary focus:ring-primary text-text-primary placeholder:text-text-secondary rounded-input transition-all duration-300 hover:border-primary/50"
                        required
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-input pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="edepot-password" className="text-text-primary font-medium text-sm">
                      Mật khẩu eDepot
                    </Label>
                    <div className="relative">
                      <Input
                        id="edepot-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={edepotFormData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="h-12 bg-foreground border-border focus:border-primary focus:ring-primary text-text-primary placeholder:text-text-secondary rounded-input transition-all duration-300 hover:border-primary/50 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-primary transition-colors duration-300"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-input pointer-events-none"></div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-3 p-4 text-sm text-primary bg-primary-light border border-primary/20 rounded-card backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 text-sm text-danger bg-red-50 border border-red-200 rounded-card">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button với Green Logistics theme */}
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground border-none rounded-card shadow-button hover:shadow-card-hover transform hover:scale-105 transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 w-5 h-5">
                      <LtaLoadingCompact />
                    </div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Container className="mr-2 h-5 w-5" />
                    Đăng Nhập
                  </>
                )}
              </Button>
            </form>

            {/* Decorative Elements với Design System colors */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-2xl pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  )
}