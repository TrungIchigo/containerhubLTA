'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, Package, MapPin, Calendar, Clock } from 'lucide-react'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ImportContainer } from '@/lib/types'

interface ConfirmCodCompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  container: ImportContainer | null
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

/**
 * Dialog xác nhận hoàn tất COD với thông tin chi tiết container
 * @param open - Trạng thái mở/đóng dialog
 * @param onOpenChange - Callback khi thay đổi trạng thái dialog
 * @param container - Thông tin container cần xác nhận
 * @param onConfirm - Callback khi xác nhận hoàn tất COD
 * @param isLoading - Trạng thái loading khi đang xử lý
 */
export function ConfirmCodCompletionDialog({
  open,
  onOpenChange,
  container,
  onConfirm,
  isLoading = false
}: ConfirmCodCompletionDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    try {
      setIsConfirming(true)
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      // Error handling được thực hiện ở component cha
    } finally {
      setIsConfirming(false)
    }
  }

  if (!container) return null

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ON_GOING_COD':
        return {
          text: 'Đang thực hiện COD',
          variant: 'info' as const,
          icon: Package
        }
      case 'AWAITING_COD_PAYMENT':
        return {
          text: 'Chờ thanh toán phí COD',
          variant: 'warning' as const,
          icon: Clock
        }
      default:
        return {
          text: status,
          variant: 'secondary' as const,
          icon: Package
        }
    }
  }

  const statusInfo = getStatusInfo(container.status)
  const StatusIcon = statusInfo.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Xác nhận hoàn tất COD
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Container Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Thông tin Container
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">Mã Container:</span>
                  <span className="font-mono font-bold text-lg">{container.container_number}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">Trạng thái hiện tại:</span>
                  <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.text}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">Loại container:</span>
                  <span>{container.container_type}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-600">Địa điểm:</span>
                </div>
                <div className="text-sm text-gray-700 ml-6">
                  {container.drop_off_location}
                </div>
                
                {container.available_from_datetime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-600">Sẵn sàng từ:</span>
                    <span className="text-sm">{formatStoredDateTimeVN(container.available_from_datetime)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-800">Lưu ý quan trọng</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Hành động này sẽ xác nhận rằng quá trình COD đã hoàn tất thành công</li>
                  <li>• Container sẽ chuyển sang trạng thái "Hoàn tất" và không thể hoàn tác</li>
                  <li>• Vui lòng đảm bảo đã nhận được thanh toán đầy đủ từ khách hàng</li>
                  <li>• Thông tin này sẽ được ghi lại trong hệ thống để kiểm toán</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-3">Quy trình sau khi xác nhận:</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Container chuyển sang trạng thái "Hoàn tất"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Ghi nhận thời gian hoàn tất trong hệ thống</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Cập nhật báo cáo và thống kê</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>Container có thể được sử dụng cho đơn hàng mới</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming || isLoading}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isConfirming || isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Xác nhận hoàn tất COD
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}