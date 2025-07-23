'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  CreditCard, 
  QrCode, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Wallet,
  ArrowRight,
  RefreshCw,
  Clock,
  Building
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { TopUpDialog } from './TopUpDialog'
import { QRCodeDisplay } from '@/components/common/QRCodeDisplay'
import { OneStopLogo } from '@/components/common/OneStopLogo'
import { 
  getPrepaidFund,
  generateCodPaymentQR,
  processPaymentWithFund,
  type PrepaidFund,
  type FundResult
} from '@/lib/actions/fund'
import type { PendingCodPayment } from '@/lib/types/billing'

interface CodPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: PendingCodPayment | null
  onPaymentSuccess?: () => void
}

export function CodPaymentDialog({ 
  open, 
  onOpenChange, 
  payment,
  onPaymentSuccess 
}: CodPaymentDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('qr_code')
  const [prepaidFund, setPrepaidFund] = useState<PrepaidFund | null>(null)
  const [qrCodeInfo, setQrCodeInfo] = useState<any>(null)
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)
  const [isLoadingFund, setIsLoadingFund] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  
  const { toast } = useToast()

  // Load prepaid fund info when dialog opens
  useEffect(() => {
    if (open) {
      loadPrepaidFund()
    }
  }, [open])

  // Debug payment data when it changes
  useEffect(() => {
    if (payment) {
      console.log('Payment data for route:', {
        original_depot_address: payment.original_depot_address,
        requested_depot_name: payment.requested_depot_name
      });
    }
  }, [payment])

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

  const generateQRCode = async () => {
    if (!payment) return
    
    setIsGeneratingQR(true)
    try {
      const result = await generateCodPaymentQR(payment.cod_fee, payment.id)
      if (result.success && result.data) {
        setQrCodeInfo(result.data)
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

  const handlePayWithFund = async () => {
    if (!payment || !prepaidFund) return

    if (prepaidFund.balance < payment.cod_fee) {
      // Show insufficient balance dialog
      return
    }

    setIsProcessingPayment(true)
    try {
      const result = await processPaymentWithFund(
        payment.id,
        payment.cod_fee,
        `Thanh toán phí COD cho container ${payment.container_number}`
      )

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Thanh toán phí COD thành công!",
          variant: "default"
        })
        onOpenChange(false)
        onPaymentSuccess?.()
      } else {
        toast({
          title: "Lỗi",
          description: result.error || result.message || "Có lỗi xảy ra khi thanh toán",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xử lý thanh toán",
        variant: "destructive"
      })
    } finally {
      setIsProcessingPayment(false)
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

  const formatCurrency = (amount?: number | null) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0 VNĐ';
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
  }

  if (!payment) return null
  
  const insufficientBalance = prepaidFund && prepaidFund.balance < payment.cod_fee

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <div>Thanh Toán Phí COD</div>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Container {payment.container_number} • {payment.delivery_confirmed_at ? formatDate(payment.delivery_confirmed_at) : 'N/A'}
                </DialogDescription>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Left Column - Payment Summary */}
            <Card className="border-0 bg-gradient-to-br from-slate-50 to-gray-50">
              <CardHeader className="pb-4 ml-2">
                <CardTitle className="text-lg flex items-center gap-2 py-1">
                  <Building className="w-5 h-5 text-slate-600" />
                  Thông Tin Thanh Toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-600">Container:</span>
                    <Badge variant="secondary" className="font-mono">
                      {payment.container_number}
                    </Badge>
                  </div>
                  
                  {/* Hiển thị tuyến đường */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-700">Tuyến đường:</div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 mb-1">Điểm giao trả cũ:</div>
                          <div className="text-sm font-medium text-slate-800">
                            {payment.original_depot_address || 'Chưa có thông tin'}
                          </div>
                        </div>
                        <div className="mx-3">
                          <ArrowRight className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 mb-1">Điểm giao trả mới:</div>
                          <div className="text-sm font-medium text-blue-600">
                            {payment.requested_depot_name || 'Chưa có thông tin'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <div className="text-sm text-slate-600">Thời gian duyệt COD:</div>
                    <span className="text-sm">{formatDate(payment.delivery_confirmed_at)}</span>
                  </div>

                  <div className="bg-green-100 border border-green-400 rounded-lg p-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">Tổng số tiền cần thanh toán:</span>
                      <span className="text-xl font-bold text-green-700">
                        {formatCurrency(payment.cod_fee)}
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2">
                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                <h5 className="font-medium mb-1">Hướng dẫn thanh toán</h5>
                                <ul className="space-y-1 text-blue-700">
                                  <li>• Quét mã QR để thanh toán nhanh qua ứng dụng ngân hàng</li>
                                  <li>• Hoặc chuyển khoản thủ công với thông tin trên</li>
                                  <li>• Vui lòng giữ nguyên nội dung chuyển khoản để xác nhận tự động</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Payment Methods */}
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="py-2 ml-2">
                <CardTitle className="text-lg">Chọn Phương Thức Thanh Toán</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="qr_code" className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      Chuyển khoản VietQR
                    </TabsTrigger>
                    <TabsTrigger value="prepaid_fund" className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Quỹ i-Prepaid@LTA
                    </TabsTrigger>
                  </TabsList>

                  {/* VietQR Payment Tab */}
                  <TabsContent value="qr_code" className="mt-6 space-y-4">
                    <div className="text-center space-y-4">
                      {!qrCodeInfo ? (
                        <div className="space-y-4">
                          <div className="w-48 h-48 mx-auto bg-slate-100 rounded-lg flex items-center justify-center">
                            <QrCode className="w-16 h-16 text-slate-400" />
                          </div>
                          <Button
                            onClick={generateQRCode}
                            disabled={isGeneratingQR}
                            className="w-full"
                          >
                            {isGeneratingQR ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Đang tạo mã QR...
                              </>
                            ) : (
                              <>
                                <QrCode className="w-4 h-4 mr-2" />
                                Tạo mã QR thanh toán
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* QR Code Display */}
                          <div className="flex justify-center">
                            <QRCodeDisplay
                              value={qrCodeInfo.qr_data || ''}
                              size={200}
                              description="Quét mã để thanh toán nhanh qua ứng dụng ngân hàng"
                              bankInfo={{
                                bankName: "Vietinbank",
                                accountNumber: qrCodeInfo.account_number,
                                accountName: qrCodeInfo.account_name,
                                amount: payment.cod_fee,
                                transferContent: `PAY COD ${payment.container_number} GIAO TRA`
                              }}
                              className="border-0 shadow-none"
                            />
                          </div>
                                                    
                          <Button variant="default" className="w-full">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Tôi đã chuyển khoản
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Prepaid Fund Payment Tab */}
                  <TabsContent value="prepaid_fund" className="mt-6 space-y-4">
                    {isLoadingFund ? (
                      <div className="text-center py-8">
                        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-slate-400" />
                        <p className="text-sm text-slate-600 mt-2">Đang tải thông tin quỹ...</p>
                      </div>
                    ) : prepaidFund ? (
                      <div className="space-y-4">
                        {/* Fund Info Header */}
                        <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <OneStopLogo size="md" />
                              <div>
                                <CardDescription className="text-green-600">
                                  Thanh toán bằng Quỹ i-Prepaid
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-green-700">Mã quỹ</Label>
                                <p className="font-mono font-bold text-green-800">{prepaidFund.fund_code}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-green-700">Số dư khả dụng</Label>
                                <p className="font-bold text-green-800">{formatCurrency(prepaidFund.balance)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Payment Summary */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-slate-600">Số tiền thanh toán:</span>
                            <span className="font-bold text-lg">{formatCurrency(payment.cod_fee)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-slate-600">Số dư sau thanh toán:</span>
                            <span className={`font-bold ${insufficientBalance ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(prepaidFund.balance - payment.cod_fee)}
                            </span>
                          </div>
                        </div>

                        {/* Payment Button or Insufficient Balance Warning */}
                        {insufficientBalance ? (
                          <div className="space-y-3">
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                  <h5 className="font-medium text-red-800">Số dư không đủ</h5>
                                  <p className="text-sm text-red-700 mt-1">
                                    Bạn cần nạp thêm {formatCurrency(payment.cod_fee - prepaidFund.balance)} để hoàn tất giao dịch này.
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setTopUpDialogOpen(true)}
                              >
                                <Wallet className="w-4 h-4 mr-2" />
                                Nạp tiền ngay
                              </Button>
                              <Button 
                                variant="default" 
                                className="flex-1"
                                disabled
                              >
                                Thanh toán ({formatCurrency(payment.cod_fee)})
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={handlePayWithFund}
                            disabled={isProcessingPayment}
                            className="w-full"
                            size="lg"
                          >
                            {isProcessingPayment ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý thanh toán...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Thanh toán {formatCurrency(payment.cod_fee)}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 mx-auto text-red-400" />
                        <h3 className="text-lg font-bold text-red-700 mt-3">Không tìm thấy quỹ prepaid</h3>
                        <p className="text-red-600 mt-1">Vui lòng liên hệ admin để thiết lập quỹ prepaid.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

        </DialogContent>
      </Dialog>

      {/* Top Up Dialog */}
      <TopUpDialog
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
        onTopUpSuccess={() => {
          loadPrepaidFund() // Reload fund info after successful top-up
        }}
      />
    </>
  )
} 