'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Container, 
  MapPin, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { createCodRequest } from '@/lib/actions/cod'
import { toast } from 'sonner'

interface OriginalOrder {
  id: string
  container_number: string
  container_type: string
  depot_id: string
  depot?: {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
  }
}

interface SelectedDepot {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

interface ConfirmationDialogProps {
  originalOrder: OriginalOrder
  selectedDepot: SelectedDepot
  codFee: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function ConfirmationDialog({
  originalOrder,
  selectedDepot,
  codFee,
  open,
  onOpenChange
}: ConfirmationDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const result = await createCodRequest({
        dropoff_order_id: originalOrder.id,
        depot_id: selectedDepot.id,
        reason_for_request: 'Yêu cầu thay đổi nơi trả container qua giao diện bản đồ',
        container_number: originalOrder.container_number,
        cod_fee: codFee
      })

      if (result.success) {
        toast.success('Yêu cầu COD đã được gửi thành công!')
        onOpenChange(false)
        router.push('/dispatcher/containers')
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi gửi yêu cầu')
      }
    } catch (error) {
      console.error('Error submitting COD request:', error)
      toast.error('Có lỗi xảy ra khi gửi yêu cầu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Container className="h-5 w-5 text-blue-600" />
            Xác nhận Yêu cầu Thay đổi Nơi Trả Container
          </DialogTitle>
          <DialogDescription>
            Vui lòng kiểm tra lại thông tin trước khi gửi yêu cầu COD
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Container Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Container className="h-4 w-4" />
              Thông tin Container
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Số Container:</p>
                <p className="font-medium">{originalOrder.container_number}</p>
              </div>
              <div>
                <p className="text-gray-600">Loại Container:</p>
                <p className="font-medium">{originalOrder.container_type}</p>
              </div>
            </div>
          </div>

          {/* Location Change Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Chi tiết Thay đổi
            </h3>
            
            {/* From */}
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-blue-900">Từ (hiện tại):</p>
                  <Badge variant="secondary">Depot gốc</Badge>
                </div>
                <p className="font-semibold">{originalOrder.depot?.name}</p>
                <p className="text-sm text-gray-600">{originalOrder.depot?.address}</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* To */}
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-green-900">Đến (mong muốn):</p>
                  <Badge variant="secondary">Depot GPG</Badge>
                </div>
                <p className="font-semibold">{selectedDepot.name}</p>
                <p className="text-sm text-gray-600">{selectedDepot.address}</p>
              </div>
            </div>
          </div>

          {/* Fee Information */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Phí COD
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Tổng phí thay đổi nơi trả:</p>
              <p className="text-2xl font-bold text-gray-900">
                {codFee === 0 ? (
                  <span className="text-green-600">Miễn phí</span>
                ) : (
                  formatCurrency(codFee)
                )}
              </p>
            </div>
          </div>

          <Separator />

          {/* Important Notes */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-orange-900">Lưu ý quan trọng:</h4>
                <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                  <li>Yêu cầu sẽ được gửi đến hãng tàu để xem xét và phê duyệt</li>
                  <li>Thời gian xử lý: 24-48 giờ làm việc</li>
                  <li>Container sẽ chuyển sang trạng thái &quot;Chờ duyệt COD&quot; sau khi gửi yêu cầu</li>
                  <li>Phí COD sẽ được thanh toán sau khi yêu cầu được phê duyệt</li>
                  <li>Bạn có thể hủy yêu cầu trong vòng 1 giờ sau khi gửi</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Gửi Yêu cầu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}