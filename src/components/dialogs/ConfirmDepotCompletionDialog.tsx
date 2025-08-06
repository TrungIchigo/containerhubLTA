'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, AlertTriangle, Package, Calendar, MapPin } from 'lucide-react'
interface ImportContainer {
  id: string
  container_number: string
  created_at: string | Date
  updated_at: string | Date
  depot_location?: string
}
import { formatDate } from '@/lib/utils'

interface ConfirmDepotCompletionDialogProps {
  /** Trạng thái hiển thị dialog */
  open: boolean
  /** Callback khi đóng dialog */
  onOpenChange: (open: boolean) => void
  /** Thông tin container cần xác nhận hoàn tất depot */
  container: ImportContainer | null
  /** Callback khi xác nhận hoàn tất depot */
  onConfirm: (containerId: string) => void
  /** Trạng thái loading khi đang xử lý */
  loading?: boolean
}

/**
 * Dialog xác nhận hoàn tất xử lý tại depot
 * Hiển thị thông tin chi tiết container và cho phép dispatcher xác nhận hoàn tất
 */
export function ConfirmDepotCompletionDialog({
  open,
  onOpenChange,
  container,
  onConfirm,
  loading = false
}: ConfirmDepotCompletionDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    if (!container) return
    
    setIsConfirming(true)
    try {
      await onConfirm(container.id)
      onOpenChange(false)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!container) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Xác nhận hoàn tất xử lý tại depot
          </DialogTitle>
          <DialogDescription>
            Xác nhận rằng container đã hoàn tất tất cả các quy trình xử lý tại depot và sẵn sàng hoàn tất vòng đời.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thông tin container */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">Thông tin container</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Số container</p>
                <p className="font-medium">{container.container_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trạng thái hiện tại</p>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Đang xử lý tại depot
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày tạo</p>
                <p className="font-medium">{formatDate(container.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                <p className="font-medium">{formatDate(container.updated_at)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Thông tin depot */}
          {container.depot_location && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold">Thông tin depot</h3>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Vị trí depot</p>
                <p className="font-medium">{container.depot_location}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Cảnh báo quan trọng */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-800">Lưu ý quan trọng</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Container sẽ chuyển sang trạng thái <strong>COMPLETED</strong> (hoàn tất vòng đời)</li>
                <li>• Không thể hoàn tác sau khi xác nhận</li>
                <li>• Đảm bảo tất cả quy trình xử lý tại depot đã hoàn tất</li>
                <li>• Container sẽ sẵn sàng cho việc tái sử dụng hoặc xuất khẩu</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConfirming || loading}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isConfirming || loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Xác nhận hoàn tất depot
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}