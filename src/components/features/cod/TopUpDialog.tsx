'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  QrCode, 
  Copy, 
  CheckCircle, 
  RefreshCw,
  Wallet,
  ArrowLeft,
  Clock,
  Building2
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import DynamicQRCodeDisplay from '@/components/common/DynamicQRCodeDisplay'
import { OneStopLogo } from '@/components/common/OneStopLogo'
import { 
  getPrepaidFund,
  generateTopUpQR,
  confirmTopUpTransfer,
  type PrepaidFund,
  type FundResult
} from '@/lib/actions/fund'

interface TopUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTopUpSuccess?: () => void
}

// Predefined amount options (matching the mobile app design)
const PREDEFINED_AMOUNTS = [
  1000000,  // 1,000,000đ
  500000,   // 500,000đ
  400000,   // 400,000đ
  300000,   // 300,000đ
  200000,   // 200,000đ
  100000    // 100,000đ
]

export function TopUpDialog({ 
  open, 
  onOpenChange, 
  onTopUpSuccess 
}: TopUpDialogProps) {
  const [step, setStep] = useState<'amount' | 'qr' | 'confirm'>('amount')
  const [selectedAmount, setSelectedAmount] = useState<number>(1000000)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [prepaidFund, setPrepaidFund] = useState<PrepaidFund | null>(null)
  const [qrCodeInfo, setQrCodeInfo] = useState<any>(null)
  const [isLoadingFund, setIsLoadingFund] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  
  const { toast } = useToast()
  const { user } = useUser()

  // Load prepaid fund info when dialog opens
  useEffect(() => {
    if (open) {
      loadPrepaidFund()
      // Reset state when dialog opens
      setStep('amount')
      setSelectedAmount(1000000)
      setCustomAmount('')
      setQrCodeInfo(null)
    }
  }, [open])

  // Clear state when user changes (fix for data persistence across different accounts)
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 TopUpDialog: User changed, clearing fund data state and reloading if dialog is open')
      setPrepaidFund(null)
      setQrCodeInfo(null)
      setStep('amount')
      setSelectedAmount(1000000)
      setCustomAmount('')
      
      // If dialog is currently open, reload the data for the new user
      if (open) {
        console.log('🔄 TopUpDialog: Dialog is open, reloading fund data for new user')
        loadPrepaidFund()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadPrepaidFund = async () => {
    setIsLoadingFund(true)
    try {
      const result = await getPrepaidFund()
      if (result.success) {
        setPrepaidFund(result.data)
      } else {
        console.error('Failed to load prepaid fund:', result.error)
      }
    } catch (error) {
      console.error('Error loading prepaid fund:', error)
    } finally {
      setIsLoadingFund(false)
    }
  }

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    if (value) {
      const numValue = parseInt(value.replace(/[^\d]/g, ''))
      if (!isNaN(numValue)) {
        setSelectedAmount(numValue)
      }
    }
  }

  const getFinalAmount = () => {
    return customAmount ? 
      parseInt(customAmount.replace(/[^\d]/g, '')) || selectedAmount : 
      selectedAmount
  }

  const handleProceedToQR = async () => {
    const amount = getFinalAmount()
    
    if (amount < 10000) {
      toast({
        title: "Lỗi",
        description: "Số tiền nạp tối thiểu là 10.000 VNĐ",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingQR(true)
    try {
      const result = await generateTopUpQR(amount)
      if (result.success && result.data) {
        setQrCodeInfo(result.data)
        setStep('qr')
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể tạo mã QR",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast({
        title: "Lỗi", 
        description: "Có lỗi xảy ra khi tạo mã QR",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleConfirmTransfer = async () => {
    if (!qrCodeInfo) return

    setIsConfirming(true)
    try {
      const result = await confirmTopUpTransfer(qrCodeInfo.qr_id)
      
      if (result.success) {
        setStep('confirm')
        setTimeout(() => {
          onOpenChange(false)
          onTopUpSuccess?.()
          toast({
            title: "Thành công",
            description: "Đã ghi nhận yêu cầu nạp tiền. Số dư sẽ được cập nhật sau khi LTA xác nhận.",
            variant: "default"
          })
        }, 2000)
      } else {
        toast({
          title: "Lỗi",
          description: result.error || result.message || "Có lỗi xảy ra",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error confirming transfer:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xác nhận chuyển khoản",
        variant: "destructive"
      })
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Đã sao chép",
      description: `${label} đã được sao chép vào clipboard`,
      variant: "default"
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ'
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
    } catch (error) {
      return 'N/A'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step !== 'amount' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (step === 'qr') setStep('amount')
                  else if (step === 'confirm') setStep('qr')
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            
            <OneStopLogo size="md" />
            
            <div>
              <DialogTitle className="text-xl text-green-800">Nạp Quỹ</DialogTitle>
              <DialogDescription className="text-green-600">
                i-Prepaid Fund
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Step 1: Amount Selection */}
          {step === 'amount' && (
            <div className="space-y-6">
              {/* Current Balance Display */}
              {isLoadingFund ? (
                <div className="text-center py-4">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-slate-400" />
                  <p className="text-sm text-slate-600 mt-2">Đang tải thông tin quỹ...</p>
                </div>
              ) : prepaidFund ? (
                <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="pt-4">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-blue-700">Số dự hiện tại:</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(prepaidFund.balance)}</p>
                      <p className="text-xs text-blue-600">Mã quỹ: {prepaidFund.fund_code}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Amount Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Số tiền cần nạp</Label>
                
                {/* Predefined Amount Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {PREDEFINED_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                      className="h-16 text-sm"
                      onClick={() => handleAmountSelect(amount)}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-600">Hoặc nhập số tiền khác</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="1,000,000"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">đ</span>
                  </div>
                </div>

                {/* Selected Amount Display */}
                <Card className="border border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-green-700">Số tiền sẽ nạp:</p>
                      <p className="text-xl font-bold text-green-900">{formatCurrency(getFinalAmount())}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Proceed Button */}
                <Button
                  onClick={handleProceedToQR}
                  disabled={isGeneratingQR || getFinalAmount() < 10000}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isGeneratingQR ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo mã QR...
                    </>
                  ) : (
                    'Nạp tiền'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: QR Code Display */}
          {step === 'qr' && qrCodeInfo && (
            <div className="space-y-6">
              {/* Amount Summary */}
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-green-700">Số tiền nạp:</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(qrCodeInfo.amount)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Display */}
              <div className="flex justify-center">
                <DynamicQRCodeDisplay
                value={qrCodeInfo.qr_data || ''}
                size={200}
                description="Quét mã để nạp tiền nhanh qua ứng dụng ngân hàng"
                bankInfo={{
                  bankName: "Liên Việt Post Bank (LPB)",
                  accountNumber: qrCodeInfo.account_number,
                  accountName: qrCodeInfo.account_name,
                  amount: qrCodeInfo.amount,
                  transferContent: qrCodeInfo.transfer_content
                }}
                className="border-0 shadow-none"
              />
              </div>

              {/* Bank Transfer Details */}
              <Card className="border border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Thông tin chuyển khoản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Ngân hàng</Label>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Liên Việt Post Bank (LPB)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Chủ tài khoản</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{qrCodeInfo.account_name}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Số tài khoản</Label>
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{qrCodeInfo.account_number}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(qrCodeInfo.account_number, 'Số tài khoản')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Số tiền</Label>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-600">{formatCurrency(qrCodeInfo.amount)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(qrCodeInfo.amount.toString(), 'Số tiền')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Nội dung chuyển khoản</Label>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm bg-yellow-50 px-2 py-1 rounded border">
                        {qrCodeInfo.transfer_content}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(qrCodeInfo.transfer_content, 'Nội dung chuyển khoản')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <h5 className="font-medium mb-1">Lưu ý quan trọng</h5>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Vui lòng giữ nguyên nội dung chuyển khoản để giao dịch được xác nhận tự động</li>
                      <li>• Số dư sẽ được cập nhật sau khi LTA xác nhận giao dịch</li>
                    </ul>
                    <p className="text-xs text-blue-600 mt-2">
                      Mã QR có hiệu lực đến: {formatDate(qrCodeInfo.expires_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirm Transfer Button */}
              <Button
                onClick={handleConfirmTransfer}
                disabled={isConfirming}
                className="w-full h-12 text-base"
                size="lg"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Tôi đã hoàn tất chuyển khoản
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && (
            <div className="text-center space-y-6 py-8">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-green-800 mb-2">Đã ghi nhận yêu cầu nạp tiền</h3>
                <p className="text-sm text-green-700">
                  Giao dịch đang được xử lý. Số dư sẽ được cập nhật sau khi LTA xác nhận.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="text-sm text-green-800">
                  <p className="font-medium">Số tiền: {qrCodeInfo ? formatCurrency(qrCodeInfo.amount) : ''}</p>
                  <p className="text-green-600 mt-1">Thời gian: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'amount' && (
          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}