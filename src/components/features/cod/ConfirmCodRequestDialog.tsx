'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, Building2, MapPin, DollarSign, FileText, Send } from 'lucide-react'
import { createCodRequest } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import { formatCodFee, type CodFeeResult } from '@/lib/actions/cod-fee-client'
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast-helpers'
import type { ImportContainer } from '@/lib/types/container'
import { LtaLoadingCompact } from '@/components/ui/ltaloading'

interface ConfirmCodRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  container: ImportContainer
  formData: {
    depot_id: string
    reason_for_request?: string
  }
  codFee: CodFeeResult | null
  selectedDepotName?: string
}

export default function ConfirmCodRequestDialog({ 
  isOpen, 
  onClose, 
  onSuccess,
  container, 
  formData, 
  codFee,
  selectedDepotName
}: ConfirmCodRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const requestData = {
        dropoff_order_id: container.id,
        depot_id: formData.depot_id,
        reason_for_request: formData.reason_for_request || '',
        container_number: container.container_number,
        cod_fee: codFee?.fee || 0
      }

      console.log('Creating COD request with data:', requestData)

      const result = await createCodRequest(requestData)

      console.log('COD request result:', {
        success: result.success,
        message: result.message,
        data: result.data
      })

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
        throw new Error(result.message || 'Có lỗi xảy ra khi tạo yêu cầu COD')
      }
    } catch (error: any) {
      console.error('Error in handleConfirm:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      })
      
      showErrorToast(
        "Lỗi",
        error.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Xác Nhận Yêu Cầu COD
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Thông tin yêu cầu */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Thông tin Container
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium">Container:</span>
                <Badge variant="outline" className="font-mono">
                  {container.container_number}
                </Badge>
                <Badge variant="secondary">
                  {container.container_type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Nơi trả theo lệnh gốc:</span>
                <span className="text-text-secondary">
                  {container.drop_off_location}
                </span>
              </div>
            </div>
          </div>

          {/* Địa điểm mới */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Địa Điểm Mới
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Depot GPG mới:</span>
                <span className="text-text-secondary">
                  {selectedDepotName}
                </span>
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
                  <li>• Container sẽ chuyển sang trạng thái &quot;Chờ duyệt COD&quot;</li>
                  {codFee?.success && codFee.fee && codFee.fee > 0 && (
                    <li>• Phí COD sẽ được áp dụng nếu được phê duyệt</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Action buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
                <div className="mr-2 w-4 h-4">
                  <LtaLoadingCompact />
                </div>
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
      </DialogContent>
    </Dialog>
  )
}