'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, Container, Truck, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import NewOrganizationForm from './NewOrganizationForm'
import { Organization } from '@/lib/types'
import { gsap } from 'gsap'

export default function RegisterForm() {
  console.log('RegisterForm component rendering...')
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    organizationType: 'TRUCKING_COMPANY' as 'TRUCKING_COMPANY' | 'SHIPPING_LINE',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [countdown, setCountdown] = useState(3)
  
  // New organization check states
  const [checkResult, setCheckResult] = useState<{
    found: boolean
    organization?: Organization
    suggestions?: Organization[]
  } | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [showNewOrgForm, setShowNewOrgForm] = useState(false)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)
  
  const router = useRouter()

  // GSAP Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const floatingIcon1Ref = useRef<HTMLDivElement>(null)
  const floatingIcon2Ref = useRef<HTMLDivElement>(null)
  const floatingIcon3Ref = useRef<HTMLDivElement>(null)
  const floatingIcon4Ref = useRef<HTMLDivElement>(null)

  // GSAP Animations
  useLayoutEffect(() => {
    // Đảm bảo container luôn hiển thị
    if (containerRef.current) {
      containerRef.current.style.opacity = '1'
      containerRef.current.style.visibility = 'visible'
    }

    // Chỉ chạy animations trên desktop
    const isDesktop = window.innerWidth >= 1024
    if (!isDesktop) return

    let retryCount = 0
    const maxRetries = 10

    const startAnimations = () => {
      const refs = [containerRef, logoRef, titleRef, subtitleRef, formRef, buttonRef]
      const floatingRefs = [floatingIcon1Ref, floatingIcon2Ref, floatingIcon3Ref, floatingIcon4Ref]
      
      if (refs.some(ref => !ref.current)) {
        retryCount++
        if (retryCount < maxRetries) {
          setTimeout(startAnimations, 200)
          return
        }
        return
      }

      console.log('Starting RegisterForm GSAP animations')

      const tl = gsap.timeline({ delay: 0.3 })

      // Set initial states - but ensure form is visible first
      const allElements = refs.map(ref => ref.current).filter(Boolean)
      
      // Make sure container is visible immediately
      if (containerRef.current) {
        containerRef.current.style.opacity = '1'
        containerRef.current.style.visibility = 'visible'
      }
      
      gsap.set(allElements.filter(el => el !== containerRef.current), {
        opacity: 0,
        y: 50,
        scale: 0.9
      })

      // Floating icons initial state
      const floatingElements = floatingRefs.map(ref => ref.current).filter(Boolean)
      gsap.set(floatingElements, {
        opacity: 0,
        scale: 0,
        rotation: 0
      })

      // Sequential entrance animations
      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)"
      })
      .to(titleRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.5")
      .to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.4")
      .to(formRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.3")
      .to(buttonRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.2)"
      }, "-=0.4")

      // Floating icons entrance
      tl.to(floatingElements, {
        opacity: 0.6,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
        stagger: 0.1
      }, "-=0.5")

      // Continuous floating animations
      floatingElements.forEach((element, index) => {
        if (element) {
          gsap.to(element, {
            y: -20,
            duration: 2 + index * 0.5,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            delay: index * 0.3
          })
          
          gsap.to(element, {
            rotation: 360,
            duration: 8 + index * 2,
            repeat: -1,
            ease: "none"
          })
        }
      })
    }

    const timer = setTimeout(startAnimations, 100)
    return () => clearTimeout(timer)
  }, [])

  // Success/Error feedback animations
  useEffect(() => {
    if (showSuccessModal && buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: "back.out(1.7)",
        yoyo: true,
        repeat: 1
      })
    }
  }, [showSuccessModal])

  useEffect(() => {
    if (errorMessage && formRef.current) {
      gsap.fromTo(formRef.current, 
        { x: 0 },
        { 
          x: 10,
          duration: 0.1,
          ease: "power2.out",
          yoyo: true,
          repeat: 5
        }
      )
    }
  }, [errorMessage])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Reset organization check when company name changes
    if (name === 'companyName') {
      setCheckResult(null)
      setSelectedOrganizationId(null)
    }
  }

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, organizationType: value as 'TRUCKING_COMPANY' | 'SHIPPING_LINE' }))
    // Reset check when organization type changes
    setCheckResult(null)
    setSelectedOrganizationId(null)
  }

  // Function to check if organization exists
  const handleOrgCheck = async () => {
    console.log('handleOrgCheck called with:', formData.companyName, formData.organizationType)
    
    if (!formData.companyName.trim() || formData.companyName.trim().length < 3) {
      console.log('Skipping check - name too short or empty')
      return
    }

    setIsChecking(true)
    setCheckResult(null)
    
    try {
      console.log('Making API call to /api/organizations/check')
      const response = await fetch('/api/organizations/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.companyName.trim(),
          type: formData.organizationType
        })
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error('Failed to check organization')
      }

      const result = await response.json()
      console.log('API result:', result)
      setCheckResult(result)
      
      if (result.found && result.organization) {
        setSelectedOrganizationId(result.organization.id)
        console.log('Found organization, selected ID:', result.organization.id)
      } else {
        console.log('No organization found')
      }
    } catch (error) {
      console.error('Error checking organization:', error)
      // Silently fail for organization check - user can still register
      setCheckResult(null)
    } finally {
      setIsChecking(false)
    }
  }

  const handleRegister = async () => {
    try {
      setDebugInfo('Starting registration process...')
      const supabase = await createClient()
      
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

      setDebugInfo('Permissions OK. Processing organization...')
      
      // Bước 1: Xử lý tổ chức
      let organizationId: string
      
      if (selectedOrganizationId) {
        // Use pre-selected organization from check
        organizationId = selectedOrganizationId
        setDebugInfo(`Using existing organization: ${organizationId}`)
      } else {
        // Fallback: Check again or create new
        const { data: existingOrg, error: orgCheckError } = await supabase
          .from('organizations')
          .select('id, name, type')
          .eq('name', formData.companyName.trim())
          .eq('type', formData.organizationType)
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
          
          // Try to create new organization with better error handling
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: formData.companyName.trim(),
              type: formData.organizationType,
              status: 'ACTIVE' // Simple registration without verification
            })
            .select('id')
            .single()

          if (orgError) {
            console.error('Organization creation error:', orgError)
            
            // Handle duplicate organization name specifically
            if (orgError.message?.includes('duplicate key value violates unique constraint') && 
                orgError.message?.includes('organizations_name_key')) {
              // Try to find the existing organization and use it
              const { data: existingDuplicate, error: duplicateCheckError } = await supabase
                .from('organizations')
                .select('id, name, type')
                .eq('name', formData.companyName.trim())
                .single()
              
              if (!duplicateCheckError && existingDuplicate) {
                organizationId = existingDuplicate.id
                setDebugInfo(`Using existing organization with same name: ${organizationId}`)
              } else {
                throw new Error(`Tên công ty "${formData.companyName}" đã tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc liên hệ admin để được hỗ trợ.`)
              }
            } else {
              throw new Error(`Failed to create organization: ${orgError.message}`)
            }
          } else {
            organizationId = newOrg.id
            setDebugInfo(`Created new organization: ${organizationId}`)
          }
        }
      }

      // Email validation and normalization
      const normalizedEmail = formData.email.toLowerCase().trim()
      setDebugInfo(`Using email: ${normalizedEmail}`)

      // Bước 2: Đăng ký người dùng - with better error handling
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
        if (error.message?.includes('Anonymous sign-ins are disabled')) {
          throw new Error('Đăng ký tài khoản hiện đang bị vô hiệu hóa. Vui lòng liên hệ admin để được hỗ trợ đăng ký tài khoản.')
        } else if (error.message?.includes('Email not confirmed')) {
          throw new Error('Email cần được xác nhận. Vui lòng kiểm tra hộp thư của bạn.')
        } else if (error.message?.includes('invalid_email') || (error.message?.includes('Email address') && error.message?.includes('invalid'))) {
          throw new Error('Email không hợp lệ. Vui lòng sử dụng email cá nhân (ví dụ: example@gmail.com)')
        } else if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
          throw new Error('Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.')
        } else if (error.message?.includes('Password should be')) {
          throw new Error('Mật khẩu không đủ mạnh. Vui lòng sử dụng mật khẩu có ít nhất 6 ký tự.')
        } else {
          throw new Error(`Lỗi đăng ký tài khoản: ${error.message}`)
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
      
      // Enhanced error handling with specific messages
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        setErrorMessage('Email này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập nếu bạn đã có tài khoản.')
      } else if (error.message?.includes('weak_password')) {
        setErrorMessage('Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn (ít nhất 6 ký tự).')
      } else if (error.message?.includes('invalid_email') || (error.message?.includes('Email address') && error.message?.includes('invalid'))) {
        setErrorMessage('Email không hợp lệ. Vui lòng sử dụng email từ nhà cung cấp phổ biến (Gmail, Outlook, Yahoo, etc.)')
      } else if (error.message?.includes('Email not confirmed')) {
        setErrorMessage('Vui lòng xác nhận email trước khi tiếp tục.')
      } else if (error.message?.includes('Anonymous sign-ins are disabled')) {
        setErrorMessage('Đăng ký tài khoản hiện đang bị vô hiệu hóa. Vui lòng liên hệ admin để được hỗ trợ.')
      } else if (error.message?.includes('duplicate key value violates unique constraint')) {
        setErrorMessage('Tên công ty đã tồn tại trong hệ thống. Vui lòng kiểm tra lại tên công ty hoặc liên hệ admin.')
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

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      // Clear any running intervals when component unmounts
    }
  }, [])

  // Handle new organization registration success
  const handleNewOrgSuccess = (orgId: string) => {
    setSelectedOrganizationId(orgId)
    setShowNewOrgForm(false)
    setCheckResult(null)
    // Show success message
    setDebugInfo('Tổ chức mới đã được đăng ký thành công!')
  }

  // Handle new organization registration cancel
  const handleNewOrgCancel = () => {
    setShowNewOrgForm(false)
  }

  // If showing new organization form, render it instead of register form
  if (showNewOrgForm) {
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
            Đăng Ký Tổ Chức
          </h1>
        </div>

        <NewOrganizationForm
          onSuccess={handleNewOrgSuccess}
          onCancel={handleNewOrgCancel}
          initialData={{
            name: formData.companyName,
            type: formData.organizationType as any
          }}
          userEmail={formData.email}
          userPassword={formData.password}
          fullName={formData.fullName}
        />
      </div>
    )
  }

        return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-primary-light/10 to-secondary-light/10 overflow-hidden lg:min-h-screen lg:h-screen"
      style={{ opacity: 1, visibility: 'visible' }}
    >
       {/* Floating Background Elements */}
       <div ref={floatingIcon1Ref} className="absolute top-20 left-20 text-primary/20 pointer-events-none">
         <Container size={48} />
       </div>
       <div ref={floatingIcon2Ref} className="absolute top-32 right-32 text-secondary/20 pointer-events-none">
         <Truck size={40} />
       </div>
       <div ref={floatingIcon3Ref} className="absolute bottom-40 left-32 text-accent/20 pointer-events-none">
         <Shield size={44} />
       </div>
       <div ref={floatingIcon4Ref} className="absolute bottom-20 right-20 text-primary/20 pointer-events-none">
         <Sparkles size={36} />
       </div>

       <div className="relative z-10 w-full max-w-md mx-auto p-8" style={{ minHeight: '400px' }}>
         {/* Logo */}
         <div ref={logoRef} className="flex justify-center mb-8">
           <Link href="/">
             <Image
               src="https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets//logo.png"
               alt="i-ContainerHub Logo"
               width={200}
               height={200}
               className="drop-shadow-lg"
             />
           </Link>
         </div>
         
         <div className="grid gap-3 text-center mb-8">
           <div ref={titleRef}>
             <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
               Đăng Ký
             </h1>
           </div>
           <p ref={subtitleRef} className="text-lg text-gray-600">
             Đã có tài khoản?{" "}
             <Link href="/login" className="font-semibold text-primary hover:text-blue-600 transition-colors">
               Đăng nhập ngay
             </Link>
           </p>
         </div>
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="grid gap-4">
          {/* Họ và tên */}
          <div className="grid gap-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          {/* Tên công ty */}
          <div className="grid gap-2">
            <Label htmlFor="companyName">Tên công ty/tổ chức</Label>
            <div className="relative">
              <Input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleInputChange}
                onBlur={handleOrgCheck}
                placeholder="Công ty Vận tải ABC"
                required
              />
              {isChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
              {!isChecking && formData.companyName.trim().length >= 3 && (
                <button
                  type="button"
                  onClick={handleOrgCheck}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-800"
                  title="Kiểm tra lại"
                >
                  🔍
                </button>
              )}
            </div>
            
            {/* Organization check results */}
            {checkResult && (
              <div className="mt-2">
                {checkResult.found ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    <CheckCircle className="h-4 w-4" />
                    <span>
                      ✅ Đã tìm thấy "{checkResult.organization?.name}". Tài khoản của bạn sẽ được liên kết với tổ chức này.
                    </span>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-yellow-700 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Tổ chức chưa có trên hệ thống</span>
                    </div>
                    <p className="text-sm text-yellow-600 mb-3">
                      Chúng tôi không tìm thấy tổ chức nào có tên tương tự. Để đảm bảo tính chính xác, vui lòng đăng ký thông tin tổ chức của bạn.
                    </p>
                    {!formData.fullName.trim() && (
                      <p className="text-sm text-red-600 mb-3 font-medium">
                        ⚠️ Vui lòng điền đầy đủ "Họ và tên" trước khi đăng ký tổ chức mới.
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewOrgForm(true)}
                      disabled={!formData.fullName.trim() || !formData.email.trim()}
                      className="bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Đăng ký Tổ chức Mới
                    </Button>
                    {(!formData.fullName.trim() || !formData.email.trim()) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Cần điền "Họ và tên" và "Email" trước khi đăng ký tổ chức mới
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Manual new organization option - always available */}
            {!checkResult && formData.companyName.trim().length >= 3 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 mb-2">
                  💡 Nếu tổ chức của bạn chưa có trên hệ thống, bạn có thể đăng ký mới:
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewOrgForm(true)}
                  disabled={!formData.fullName.trim() || !formData.email.trim()}
                  className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Đăng ký Tổ chức Mới
                </Button>
                {(!formData.fullName.trim() || !formData.email.trim()) && (
                  <p className="text-xs text-gray-500 mt-2">
                    Cần điền "Họ và tên" và "Email" trước khi đăng ký tổ chức mới
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Loại tổ chức */}
          <div className="grid gap-2">
            <Label>Loại tổ chức</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="organizationType"
                  value="TRUCKING_COMPANY"
                  checked={formData.organizationType === 'TRUCKING_COMPANY'}
                  onChange={(e) => handleRadioChange(e.target.value)}
                  className="text-primary"
                />
                <span>Công ty vận tải</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="organizationType"
                  value="SHIPPING_LINE"
                  checked={formData.organizationType === 'SHIPPING_LINE'}
                  onChange={(e) => handleRadioChange(e.target.value)}
                  className="text-primary"
                />
                <span>Hãng tàu</span>
              </label>
            </div>
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Địa chỉ email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@vantai-abc.com"
              required
            />
          </div>

          {/* Mật khẩu */}
          <div className="grid gap-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
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

          {/* Debug Info */}
          {debugInfo && (
            <div className="p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
              {debugInfo}
            </div>
          )}



              <Button 
                ref={buttonRef}
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={isLoading || (checkResult && !checkResult.found && !showNewOrgForm) || false}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Tạo Tài Khoản'
                )}
              </Button>
            </div>
          </form>

          {/* Modal thành công */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="text-center">
                  <div className="text-green-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Đăng ký thành công!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tài khoản của bạn đã được tạo thành công. Đang chuyển hướng trong {countdown} giây...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
} 