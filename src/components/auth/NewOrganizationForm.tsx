'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RefreshCw } from 'lucide-react'
import { OrganizationType } from '@/lib/types'
import { requestNewOrganization, verifyOtp, resendOtp } from '@/lib/actions/auth'
import { LtaLoadingCompact } from '@/components/ui/ltaloading'
import { useRouter } from 'next/navigation'

interface NewOrganizationFormProps {
  onSuccess: (orgId: string) => void
  onCancel: () => void
  initialData: {
    name: string
    type: OrganizationType
  }
  userEmail: string
  userPassword: string
  fullName: string
}

interface OrgFormData {
  name: string
  tax_code: string
  address: string
  phone_number: string
  representative_email: string
}

export default function NewOrganizationForm({ 
  onSuccess, 
  onCancel, 
  initialData,
  userEmail,
  userPassword,
  fullName
}: NewOrganizationFormProps) {
  const [formData, setFormData] = useState<OrgFormData>({
    name: initialData.name,
    tax_code: '',
    address: '',
    phone_number: '',
    representative_email: userEmail
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [pendingOrgId, setPendingOrgId] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [canResendOtp, setCanResendOtp] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [countdown, setCountdown] = useState(60)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateMST = (mst: string): boolean => {
    // MST phải là 10 hoặc 13 chữ số
    const cleanMST = mst.replace(/\D/g, '')
    return cleanMST.length === 10 || cleanMST.length === 13
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateMST(formData.tax_code)) {
      setErrorMessage('Mã số thuế phải là 10 hoặc 13 chữ số')
      return
    }

    if (!termsAccepted) {
      setErrorMessage('Vui lòng đồng ý với điều khoản dịch vụ và chính sách bảo mật')
      return
    }

    console.log('🚀 NewOrganizationForm submit with values:', {
      representativeEmail: formData.representative_email,
      companyName: formData.name,
      organizationType: initialData.type,
      fullName: fullName,
      // Don't log password or sensitive data
      hasPassword: !!userPassword
    })
    
    setErrorMessage('')
    setIsLoading(true)

    try {
      console.log('📞 Calling requestNewOrganization...')
      console.log('🔍 Using representative email:', formData.representative_email)
      const result = await requestNewOrganization({
        email: formData.representative_email, // Use representative email as primary email
        password: userPassword,
        fullName: fullName,
        companyName: formData.name,
        organizationType: initialData.type,
        taxCode: formData.tax_code,
        address: formData.address,
        phoneNumber: formData.phone_number,
        representativeEmail: formData.representative_email
      })

      console.log('📋 requestNewOrganization result:', {
        success: result.success,
        message: result.message,
        tempKey: result.tempKey || 'not-provided'
      })

      if (result.success) {
        console.log('✅ Registration successful! Setting showOtpInput=true')
        console.log('❌ Will NOT call onSuccess() - staying in OTP mode')
        
        // CRITICAL: Do NOT call onSuccess here - stay in OTP mode
        setPendingOrgId(null)
        setShowOtpInput(true)
        setSuccessMessage('Mã OTP đã được gửi đến email: ' + formData.representative_email)
        
        // Start countdown timer
        setCountdown(60)
        setCanResendOtp(false)
        
        // Enable resend OTP after 60 seconds with countdown
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              setCanResendOtp(true)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        console.error('❌ Registration failed:', result.message)
        setErrorMessage(result.message || 'Có lỗi xảy ra khi đăng ký')
      }
    } catch (error: any) {
      console.error('💥 Fatal error in handleSubmit:', {
        error: error,
        message: error?.message,
        stack: error?.stack
      })
      setErrorMessage('Lỗi hệ thống: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otpCode) {
      console.log('❌ No OTP code entered')
      return
    }

    console.log('🔐 Starting OTP verification...')
    console.log('📧 Email:', formData.representative_email)
    console.log('🔢 OTP Code:', otpCode)
    
    setIsLoading(true)
    setErrorMessage('')

    try {
      console.log('🔐 Verifying OTP for email:', formData.representative_email)
      const result = await verifyOtp(
        formData.representative_email,
        otpCode,
        'signup'
        // Note: No organizationId passed because organization will be created during OTP verification
      )

      console.log('📋 OTP verification result:', {
        success: result.success,
        message: result.message
      })

      if (!result.success) {
        console.error('❌ OTP verification failed:', result.message)
        setErrorMessage(result.message)
        return
      }

      console.log('✅ OTP verification successful!')
      console.log('🚀 About to navigate to login page...')
      
      // Success! Navigate to login page with success message
      const targetUrl = '/login?success=registration&message=' + encodeURIComponent('Đăng ký thành công! Tài khoản của bạn đang chờ admin phê duyệt. Bạn sẽ nhận được email thông báo khi tài khoản được kích hoạt.')
      console.log('🎯 Target URL:', targetUrl)
      
      router.push(targetUrl)
      
    } catch (error: any) {
      console.error('💥 Fatal error in handleOtpSubmit:', error)
      setErrorMessage(error.message || 'Đã có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!canResendOtp) return

    setIsLoading(true)
    setErrorMessage('')
    setCanResendOtp(false)

    try {
      const result = await resendOtp(formData.representative_email, 'signup')
      
      if (result.success) {
        setErrorMessage('') // Clear any previous errors
        setSuccessMessage(result.message || 'Mã OTP mới đã được gửi!')
        
        // Restart countdown
        setCountdown(60)
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              setCanResendOtp(true)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setErrorMessage(result.message)
        setCanResendOtp(true) // Allow retry immediately on error
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Đã có lỗi xảy ra')
      setCanResendOtp(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (showOtpInput) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Xác thực Email</h3>
          <p className="text-sm text-gray-600 mt-2">
            Chúng tôi đã gửi mã xác thực đến email: {formData.representative_email}
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <Label htmlFor="otpCode">Mã xác thực (OTP)</Label>
            <Input
              id="otpCode"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Nhập mã 6 chữ số"
              maxLength={6}
              required
            />
          </div>

          {successMessage && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {errorMessage}
            </div>
          )}

          {/* Resend OTP section */}
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResendOtp}
              disabled={!canResendOtp || isLoading}
              className="text-sm"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 w-4 h-4">
                    <LtaLoadingCompact />
                  </div>
                  Đang gửi...
                </>
              ) : canResendOtp ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Gửi lại mã OTP
                </>
              ) : (
                `Gửi lại mã OTP (${countdown}s)`
              )}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !otpCode}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 w-4 h-4">
                    <LtaLoadingCompact />
                  </div>
                  Đang xác thực...
                </>
              ) : (
                'Xác thực'
              )}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Đăng ký Tổ chức Mới</h3>
        <p className="text-sm text-gray-600 mt-1">
          Vui lòng điền đầy đủ thông tin tổ chức để tiếp tục
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Tên Công ty/Tổ chức (Đầy đủ theo ĐKKD)</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="tax_code">Mã số thuế (MST)</Label>
          <Input
            id="tax_code"
            name="tax_code"
            type="text"
            value={formData.tax_code}
            onChange={handleInputChange}
            placeholder="10 hoặc 13 chữ số"
            required
          />
        </div>

        <div>
          <Label htmlFor="address">Địa chỉ trụ sở</Label>
          <Input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone_number">Số điện thoại công ty</Label>
          <Input
            id="phone_number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="representative_email">Email người đại diện pháp luật</Label>
          <Input
            id="representative_email"
            name="representative_email"
            type="email"
            value={formData.representative_email}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Terms and conditions checkbox */}
        <div className="flex items-start space-x-2 p-4 bg-gray-50 rounded-lg">
          <Checkbox 
            id="terms" 
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            className="mt-1"
          />
          <div className="text-sm">
            <label htmlFor="terms" className="text-gray-700 leading-relaxed cursor-pointer">
              Tôi đã đọc và đồng ý với{' '}
              <Link 
                href="/terms-of-service" 
                target="_blank"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Điều khoản Dịch vụ
              </Link>
              {' '}và{' '}
              <Link 
                href="/privacy-policy" 
                target="_blank"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Chính sách Bảo mật
              </Link>
              {' '}của i-ContainerHub@LTA.
            </label>
          </div>
        </div>

        {errorMessage && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !termsAccepted}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="mr-2 w-4 h-4">
                  <LtaLoadingCompact />
                </div>
                Đang xử lý...
              </>
            ) : (
              'Gửi yêu cầu đăng ký'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 