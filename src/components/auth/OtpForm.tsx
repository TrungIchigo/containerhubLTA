'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw } from 'lucide-react'
import { verifyOtp, resendOtp } from '@/lib/actions/auth'
import { Loader } from '@/components/ui/loader'

interface OtpFormProps {
  email: string
  onSuccess: () => void
  onCancel: () => void
  title?: string
  description?: string
  organizationId?: string
}

export default function OtpForm({
  email,
  onSuccess,
  onCancel,
  title = "Xác thực Email",
  description,
  organizationId
}: OtpFormProps) {
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [canResendOtp, setCanResendOtp] = useState(false)

  // Enable resend after 60 seconds
  useState(() => {
    const timer = setTimeout(() => {
      setCanResendOtp(true)
    }, 60000)
    
    return () => clearTimeout(timer)
  })

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otpCode) return

    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await verifyOtp(
        email,
        otpCode,
        'signup',
        organizationId
      )

      if (!result.success) {
        setErrorMessage(result.message)
        return
      }

      onSuccess()
    } catch (error: any) {
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
      const result = await resendOtp(email, 'signup')
      
      if (result.success) {
        setErrorMessage('') // Clear any previous errors
        // Re-enable resend after another 60 seconds
        setTimeout(() => {
          setCanResendOtp(true)
        }, 60000)
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">
          {description || `Chúng tôi đã gửi mã xác thực đến email: ${email}`}
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
            className="text-center text-lg tracking-widest"
          />
        </div>

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
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : canResendOtp ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Gửi lại mã OTP
              </>
            ) : (
              'Gửi lại mã OTP (60s)'
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
                  <Loader size="sm" />
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