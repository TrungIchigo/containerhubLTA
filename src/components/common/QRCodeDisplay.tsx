'use client'

import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Maximize2, 
  QrCode as QrCodeIcon,
  AlertCircle 
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface QRCodeDisplayProps {
  value: string
  size?: number
  title?: string
  description?: string
  bankInfo?: {
    bankName: string
    accountNumber: string
    accountName: string
    amount: number
    transferContent: string
  }
  className?: string
}

export function QRCodeDisplay({
  value,
  size = 200,
  description,
  bankInfo,
  className = ""
}: QRCodeDisplayProps) {
  const [enlarged, setEnlarged] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const formatCurrency = (amount?: number | null) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '0 VNĐ';
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  }

  const handleDownload = () => {
    try {
      const canvas = document.querySelector('canvas')
      if (canvas) {
        const link = document.createElement('a')
        link.download = `qr-code-${Date.now()}.png`
        link.href = canvas.toDataURL()
        link.click()
      } else {
        setDownloadError('Không thể tải xuống mã QR')
        setTimeout(() => setDownloadError(null), 3000)
      }
    } catch (error) {
      console.error('Error downloading QR code:', error)
      setDownloadError('Có lỗi xảy ra khi tải xuống')
      setTimeout(() => setDownloadError(null), 3000)
    }
  }

  return (
    <>
      <Card className={`relative overflow-hidden ${className}`}>
        <CardContent className="p-4">
          <div className="text-center space-y-4">
            {/* Header */}

            {/* QR Code */}
            <div className="relative mx-auto">
              <div className="bg-white p-4 rounded-lg border border-slate-200 inline-block">
                {value ? (
                  <QRCodeCanvas
                    value={value}
                    size={size}
                    level="M"
                    includeMargin={false}
                    fgColor="#1f2937"
                    bgColor="#ffffff"
                  />
                ) : (
                  <div 
                    style={{ width: size, height: size }}
                    className="bg-slate-100 rounded flex items-center justify-center"
                  >
                    <QrCodeIcon className="w-12 h-12 text-slate-400" />
                  </div>
                )}
              </div>
              
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-slate-600">{description}</p>
            )}

            {/* Bank Info Summary */}
            {bankInfo && (
              <div className="bg-slate-50 rounded-lg p-3 text-left space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600">Ngân hàng:</span>
                    <div className="font-medium">{bankInfo.bankName}</div>
                  </div>
                  <div>
                    <span className="text-slate-600">Số tiền:</span>
                    <div className="font-bold text-blue-600">{formatCurrency(bankInfo.amount)}</div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 text-sm">Nội dung:</span>
                  <div className="font-mono text-sm bg-yellow-50 px-2 py-1 rounded border mt-1">
                    {bankInfo.transferContent}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!value}
              >
                <Download className="w-4 h-4 mr-1" />
                Tải xuống
              </Button>
            </div>

            {/* Download Error */}
            {downloadError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {downloadError}
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      {/* Enlarged QR Code Dialog */}
      <Dialog open={enlarged} onOpenChange={setEnlarged}>
        <DialogContent className="max-w-md">
          
          <div className="text-center space-y-4">
            <div className="bg-white p-6 rounded-lg border border-slate-200 inline-block">
              {value && (
                <QRCodeCanvas
                  value={value}
                  size={280}
                  level="M"
                  includeMargin={false}
                  fgColor="#1f2937"
                  bgColor="#ffffff"
                />
              )}
            </div>
            
            {description && (
              <p className="text-sm text-slate-600">{description}</p>
            )}

            {bankInfo && (
              <div className="bg-slate-50 rounded-lg p-4 text-left space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <span className="text-slate-600 text-sm">Ngân hàng:</span>
                    <div className="font-medium">{bankInfo.bankName}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 text-sm">Số tài khoản:</span>
                    <div className="font-mono">{bankInfo.accountNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 text-sm">Chủ tài khoản:</span>
                    <div className="font-medium">{bankInfo.accountName}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 text-sm">Số tiền:</span>
                    <div className="font-bold text-blue-600 text-lg">{formatCurrency(bankInfo.amount)}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 text-sm">Nội dung chuyển khoản:</span>
                    <div className="font-mono text-sm bg-yellow-50 px-3 py-2 rounded border mt-1">
                      {bankInfo.transferContent}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleDownload} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Tải xuống mã QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 