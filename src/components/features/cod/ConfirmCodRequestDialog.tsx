'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, Building2, MapPin, DollarSign, FileText, Loader2, Send } from 'lucide-react'
import { createCodRequest } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import { formatCodFee, type CodFeeResult } from '@/lib/actions/cod-fee-client'
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast-helpers'
import type { ImportContainer } from '@/lib/types'

interface ConfirmCodRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  container: ImportContainer
  formData: {
    city_id: string
    depot_id: string
    reason_for_request?: string
  }
  codFee: CodFeeResult | null
  selectedDepotName?: string
  selectedCityName?: string
}

export default function ConfirmCodRequestDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  container, 
  formData, 
  codFee,
  selectedDepotName,
  selectedCityName
}: ConfirmCodRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      console.log('Creating COD request with data:', {
        dropoff_order_id: container.id,
        city_id: formData.city_id,
        depot_id: formData.depot_id,
        reason_for_request: formData.reason_for_request || ''
      })

      const result = await createCodRequest({
        dropoff_order_id: container.id,
        city_id: formData.city_id,
        depot_id: formData.depot_id,
        reason_for_request: formData.reason_for_request || ''
      })

      console.log('COD request result:', result)

      if (result.success) {
        const feeMessage = result.data?.codFee 
          ? ` Phí COD: ${result.data.codFee.toLocaleString('vi-VN')} VNĐ.`
          : ' Không có phí bổ sung.'
          
        showSuccessToast(
          "Yêu Cầu COD Đã Được Gửi",
          `Đã gửi yêu cầu thay đổi nơi giao trả thành công!${feeMessage}`
        )
        
        onSuccess()
        onClose()
      } else {
        console.error('COD request failed:', result)
        throw new Error(result.message || 'Có lỗi xảy ra')
      }
    } catch (error: any) {
      console.error('Error creating COD request:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      })
      
      showErrorToast(
        "Lỗi",
        error.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Xác Nhận Gửi Yêu Cầu COD
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cảnh báo */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-orange-800">Xác nhận thông tin</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Vui lòng kiểm tra kỹ thông tin trước khi gửi yêu cầu. 
                  Sau khi gửi, bạn sẽ cần chờ hãng tàu phê duyệt.
                </p>
              </div>
            </div>
          </div>

          {/* Thông tin Container */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Thông Tin Container
            </h3>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium">Số Container:</span>
                <Badge variant="outline" className="font-mono">
                  {container.container_number}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Loại Container:</span>
                <Badge variant="secondary">
                  {typeof container.container_type === 'object' && container.container_type && 'code' in container.container_type
                    ? (container.container_type as any).code 
                    : container.container_type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Thông tin thay đổi */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Chi Tiết Thay Đổi
            </h3>
            
            <div className="space-y-3">
              {/* Từ */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-red-700">Từ (hiện tại):</span>
                  <div className="text-sm text-text-secondary break-words mt-1">
                    {container.drop_off_location}
                  </div>
                </div>
              </div>
              
              {/* Đến */}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-green-700">Đến (mong muốn):</span>
                  <div className="text-sm text-text-secondary mt-1">
                    <div className="font-medium">{selectedDepotName || 'Depot được chọn'}</div>
                    <div className="text-xs">{selectedCityName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phí COD */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Phí COD
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  {codFee?.success && codFee.fee !== undefined ? (
                    <>Phí COD: {formatCodFee(codFee.fee)}</>
                  ) : (
                    <>Phí COD: Miễn phí</>
                  )}
                </span>
              </div>
              {codFee?.message && (
                <p className="text-xs text-blue-700 mt-1">
                  {codFee.message}
                </p>
              )}
            </div>
          </div>

          {/* Lý do */}
          {formData.reason_for_request && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-text-primary border-b pb-2">
                Lý Do Yêu Cầu
              </h3>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-text-secondary">
                    {formData.reason_for_request}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lưu ý quan trọng */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800">Lưu ý quan trọng</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Yêu cầu sẽ được gửi đến hãng tàu để xem xét</li>
                  <li>• Thời hạn xử lý: 24 giờ</li>
                  <li>• Container sẽ chuyển sang trạng thái "Chờ duyệt COD"</li>
                  {codFee?.success && codFee.fee && codFee.fee > 0 && (
                    <li>• Phí COD sẽ được áp dụng nếu được phê duyệt</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Gửi Yêu Cầu
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 