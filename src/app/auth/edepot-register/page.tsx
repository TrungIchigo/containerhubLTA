'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ExternalLink, Building2, UserPlus, Shield, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { gsap } from 'gsap'
import { Suspense } from 'react'

function EDepotRegisterContent() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Refs cho GSAP animations
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  // Animation on mount
  useEffect(() => {
    const tl = gsap.timeline()
    
    // Set initial states
    gsap.set([logoRef.current, cardRef.current], {
      opacity: 0,
      y: 30,
      scale: 0.95
    })

    // Animate elements
    tl.to(logoRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: "power3.out"
    })
    .to(cardRef.current, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: "power3.out"
    }, "-=0.3")

    return () => {
      tl.kill()
    }
  }, [])

  const handleRedirectToEDepot = () => {
    setIsLoading(true)
    // Redirect to eDepot registration page
    window.open('https://edepot.gsotgroup.vn/register', '_blank')
    
    // Reset loading state after a delay
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary-light/10 to-background" />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-8 text-primary/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${1 + Math.random() * 1.5}rem`,
              animation: `float ${15 + Math.random() * 10}s infinite linear`
            }}
          >
            {i % 4 === 0 && <Building2 />}
            {i % 4 === 1 && <UserPlus />}
            {i % 4 === 2 && <Shield />}
            {i % 4 === 3 && <CheckCircle />}
          </div>
        ))}
      </div>

      {/* Main Container */}
      <div ref={containerRef} className="relative z-10 flex items-center justify-center w-full h-full min-h-screen p-6">
        <div className="w-full max-w-2xl">
          
          {/* Logo */}
          <div ref={logoRef} className="flex justify-center mb-8">
            <Link href="/" className="transform hover:scale-105 transition-transform duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                <Image
                  src="https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets//logo.png"
                  alt="i-ContainerHub Logo"
                  width={100}
                  height={100}
                  className="relative z-10 drop-shadow-lg"
                />
              </div>
            </Link>
          </div>

          {/* Main Card */}
          <Card ref={cardRef} className="border-border/50 shadow-card backdrop-blur-sm bg-foreground/95">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
              
              <CardTitle className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-primary via-primary-dark to-secondary bg-clip-text text-transparent">
                  Đăng Ký Tài Khoản eDepot
                </span>
              </CardTitle>
              
              <CardDescription className="text-lg text-text-secondary">
                Để sử dụng đầy đủ tính năng của i-ContainerHub, bạn cần có tài khoản eDepot
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Information Section */}
              <div className="bg-primary-light/10 border border-primary/20 rounded-card p-6 space-y-4">
                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Tại sao cần tài khoản eDepot?
                </h3>
                
                <div className="space-y-3 text-text-secondary">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Truy cập dữ liệu container và depot thời gian thực</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Đồng bộ thông tin vận chuyển và logistics</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Tích hợp hoàn toàn với hệ thống quản lý depot</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bảo mật cao với xác thực đa lớp</span>
                  </div>
                </div>
              </div>

              {/* Registration Steps */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-text-primary">Các bước đăng ký:</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-foreground border border-border rounded-card">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      1
                    </div>
                    <span className="text-text-secondary">Nhấn nút "Đăng Ký eDepot" bên dưới</span>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-foreground border border-border rounded-card">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      2
                    </div>
                    <span className="text-text-secondary">Điền thông tin đăng ký trên trang eDepot</span>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-foreground border border-border rounded-card">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      3
                    </div>
                    <span className="text-text-secondary">Chờ xác nhận từ quản trị viên eDepot</span>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-foreground border border-border rounded-card">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                      4
                    </div>
                    <span className="text-text-secondary">Quay lại đăng nhập i-ContainerHub với tài khoản eDepot</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={handleRedirectToEDepot}
                  className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground border-none rounded-card shadow-button hover:shadow-card-hover transform hover:scale-105 transition-all duration-300"
                  disabled={isLoading}
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  {isLoading ? 'Đang chuyển hướng...' : 'Đăng Ký eDepot'}
                </Button>
                
                <Button
                  onClick={handleBackToLogin}
                  variant="outline"
                  className="flex-1 h-12 text-lg font-semibold border-border hover:bg-primary-light/10 hover:border-primary transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Quay Lại Đăng Nhập
                </Button>
              </div>

              {/* Support Information */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-text-secondary">
                  Cần hỗ trợ? Liên hệ:{' '}
                  <a 
                    href="mailto:support@gsotgroup.vn" 
                    className="text-primary hover:text-primary-dark transition-colors duration-300 underline"
                  >
                    support@gsotgroup.vn
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(120deg); }
          66% { transform: translateY(5px) rotate(240deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function EDepotRegisterPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Đang tải...</div>}>
      <EDepotRegisterContent />
    </Suspense>
  )
}