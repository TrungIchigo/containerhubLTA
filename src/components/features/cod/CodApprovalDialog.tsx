'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Package, Building2, MapPin, Loader2 } from 'lucide-react'
import { handleCodDecision } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import type { CodRequestWithDetails } from '@/lib/types'

interface CodApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  request: CodRequestWithDetails
}

export default function CodApprovalDialog({ isOpen, onClose, request }: CodApprovalDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleApprove = async () => {
    setIsLoading(true)

    try {
      const result = await handleCodDecision(request.id, 'APPROVED')

      if (result.success) {
        toast({
          title: "✅ Thành công",
          description: result.message,
          variant: "default"
        })
        onClose()
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error approving COD request:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi phê duyệt yêu cầu',
        variant: "destructive"
      })
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Phê Duyệt Yêu Cầu COD
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thông tin yêu cầu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Thông tin Yêu Cầu
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium">Container:</span>
                <Badge variant="outline" className="font-mono">
                  {request.import_container?.container_number}
                </Badge>
                <Badge variant="secondary">
                  {request.import_container?.container_type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Công ty yêu cầu:</span>
                <span className="text-text-secondary">
                  {request.requesting_org?.name}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Từ:</span>
                  <span className="text-text-secondary text-sm">
                    {request.original_depot_address}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Đến:</span>
                  <span className="text-text-secondary text-sm">
                    {request.requested_depot?.name}
                  </span>
                </div>
              </div>
              
              {request.reason_for_request && (
                <div className="space-y-1">
                  <span className="font-medium">Lý do:</span>
                  <p className="text-sm text-text-secondary bg-white p-2 rounded border">
                    {request.reason_for_request}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Xác nhận */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Phê duyệt miễn phí</h4>
                <p className="text-sm text-green-700 mt-1">
                  Bạn đang phê duyệt yêu cầu thay đổi nơi trả container này mà không tính phí bổ sung.
                  Container sẽ được cập nhật địa điểm mới và sẵn sàng cho các hoạt động tiếp theo.
                </p>
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
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Phê Duyệt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 