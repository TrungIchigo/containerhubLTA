import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, ArrowRight, Truck, Container, ArrowRightLeft, Eye, MapPin as MapPinIcon, CreditCard, CheckCircle, XCircle } from 'lucide-react'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ImportContainer, ExportBooking, Organization } from '@/lib/types'
import { useState } from 'react'
import { ConfirmCodCompletionDialog } from '@/components/features/cod/ConfirmCodCompletionDialog'
import { OrderDetailModal } from '@/components/features/dispatcher/dashboard/OrderDetailModal'

interface DropoffOrderCardProps {
  container: ImportContainer & { shipping_line?: Organization }
  onViewDetails?: (container: ImportContainer) => void
  onRequestCod?: (container: ImportContainer) => void
  onPayCodFee?: (container: ImportContainer) => void
  onConfirmCodDelivery?: (container: ImportContainer) => void
  onConfirmDepotCompletion?: (container: ImportContainer) => void
  onRequestReuse?: (container: ImportContainer) => void
}

export function DropoffOrderCard({ 
  container, 
  onViewDetails,
  onRequestCod,
  onPayCodFee,
  onConfirmCodDelivery,
  onConfirmDepotCompletion,
  onRequestReuse
}: DropoffOrderCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const statusMap = {
    'AVAILABLE': { text: 'Lệnh mới tạo', variant: 'new-order' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'AWAITING_REUSE_APPROVAL': { text: 'Chờ duyệt Re-use', variant: 'pending-reuse' as const, bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'AWAITING_COD_APPROVAL': { text: 'Chờ duyệt thay đổi địa điểm', variant: 'pending-cod' as const, bg: 'bg-orange-50', border: 'border-orange-200' },
    'AWAITING_COD_PAYMENT': { text: 'Chờ thanh toán phí thay đổi địa điểm', variant: 'pending-cod-payment' as const, bg: 'bg-orange-50', border: 'border-orange-200' },
    'AWAITING_REUSE_PAYMENT': { text: 'Chờ thanh toán phí Re-use', variant: 'pending-reuse-payment' as const, bg: 'bg-orange-50', border: 'border-orange-200' },
    'ON_GOING_COD': { text: 'Đang thực hiện thay đổi địa điểm', variant: 'processing-cod' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
  'ON_GOING_REUSE': { text: 'Đang thực hiện Re-use', variant: 'processing-reuse' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
    'DEPOT_PROCESSING': { text: 'Đang xử lý tại Depot', variant: 'processing-depot' as const, bg: 'bg-purple-50', border: 'border-purple-200' },
    'COMPLETED': { text: 'Hoàn tất', variant: 'completed' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'COD_REJECTED': { text: 'Bị từ chối thay đổi địa điểm', variant: 'declined-cod' as const, bg: 'bg-red-50', border: 'border-red-200' },
    'REUSE_REJECTED': { text: 'Bị từ chối Re-use', variant: 'declined-reuse' as const, bg: 'bg-red-50', border: 'border-red-200' },
  }

  const getStatusInfo = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      variant: 'outline' as const, 
      bg: 'bg-gray-50', 
      border: 'border-gray-200' 
    }
  }

  const statusInfo = getStatusInfo(container.status)

  // Xác định các action có thể thực hiện dựa trên status
  const getAvailableActions = () => {
    const actions: any[] = []

    // Không thêm nút xem chi tiết vào actions array vì đã có button riêng biệt

    // Các action theo status
    switch (container.status) {
      case 'AVAILABLE':
        if (onRequestCod) {
          actions.push({
            id: 'request-cod',
            label: 'Yêu cầu thay đổi địa điểm',
            variant: 'default' as const,
            icon: MapPinIcon,
            onClick: () => onRequestCod(container),
            priority: 'high'
          })
        }
        if (onRequestReuse) {
          actions.push({
            id: 'request-reuse',
            label: 'Tìm Re-use',
            variant: 'secondary' as const,
            icon: ArrowRightLeft,
            onClick: () => onRequestReuse(container),
            priority: 'medium'
          })
        }
        break

      case 'AWAITING_COD_PAYMENT':
        if (onPayCodFee) {
          actions.push({
            id: 'pay-cod-fee',
            label: 'Thanh toán phí thay đổi địa điểm',
            variant: 'default' as const,
            icon: CreditCard,
            onClick: async () => {
              setIsLoading(true)
              try {
                await onPayCodFee(container)
              } finally {
                setIsLoading(false)
              }
            },
            priority: 'high'
          })
        }
        break

      case 'AWAITING_COD_APPROVAL':
        // Chờ admin duyệt, không có action cho dispatcher
        break

      case 'ON_GOING_COD':
        if (onConfirmCodDelivery) {
          actions.push({
            id: 'confirm-delivery',
            label: 'Xác nhận hoàn tất thay đổi địa điểm',
            variant: 'default' as const,
            icon: CheckCircle,
            onClick: () => {
              setConfirmDialogOpen(true)
            },
            priority: 'high'
          })
        }
        break

      case 'DEPOT_PROCESSING':
        if (onConfirmDepotCompletion) {
          actions.push({
            id: 'confirm-depot-completion',
            label: 'Xác nhận hoàn tất depot',
            variant: 'default' as const,
            icon: CheckCircle,
            onClick: async () => {
              setIsLoading(true)
              try {
                await onConfirmDepotCompletion(container)
              } finally {
                setIsLoading(false)
              }
            },
            priority: 'high'
          })
        }
        break

      case 'COD_REJECTED':
      case 'REUSE_REJECTED':
        // Có thể yêu cầu lại
        if (onRequestCod) {
          actions.push({
            id: 'request-cod-again',
            label: 'Yêu cầu thay đổi địa điểm lại',
            variant: 'outline' as const,
            icon: MapPinIcon,
            onClick: () => onRequestCod(container),
            priority: 'medium'
          })
        }
        break

      default:
        break
    }

    return actions
  }

  const availableActions = getAvailableActions()

  const handleConfirmCodCompletion = async () => {
    if (!onConfirmCodDelivery) return
    
    setIsLoading(true)
    try {
      await onConfirmCodDelivery(container)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${statusInfo.bg} ${statusInfo.border} border-2`}>
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Header with Container Icon */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Container className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-text-primary text-lg">{container.container_number}</div>
                  <Badge variant="outline" className="mt-1 bg-white/80">{container.container_type}</Badge>
                </div>
              </div>
              <Badge variant={statusInfo.variant} className="shadow-sm">{statusInfo.text}</Badge>
            </div>
            
            {/* Shipping Line */}
            <div className="rounded-lg p-3">
              <div className="text-sm text-gray-600 font-medium">Hãng tàu</div>
              <div className="text-text-primary font-semibold">{container.shipping_line?.name || 'N/A'}</div>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">{container.drop_off_location}</span>
            </div>
            
            {/* Time */}
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Hạn trả rỗng</div>
                <div className="font-medium">{formatStoredDateTimeVN(container.available_from_datetime)}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {/* Button Xem chi tiết luôn hiển thị */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetailModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem chi tiết
                </Button>
                
                {/* Các action buttons khác */}
                {availableActions
                  .filter(action => action.id !== 'view-details')
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 }
                    return priorityOrder[b.priority] - priorityOrder[a.priority]
                  })
                  .map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant}
                      size="sm"
                      onClick={action.onClick}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      <action.icon className="w-3 h-3 mr-1" />
                      {action.label}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <ConfirmCodCompletionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        container={container}
        onConfirm={handleConfirmCodCompletion}
        isLoading={isLoading}
      />
      
      {/* Detail Modal */}
      <OrderDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        container={container}
        onRequestCod={onRequestCod}
        onPayCodFee={onPayCodFee}
        onConfirmCodDelivery={onConfirmCodDelivery}
        onConfirmDepotCompletion={onConfirmDepotCompletion}
        onRequestReuse={onRequestReuse}
      />
    </>
  )
}

interface BookingCardProps {
  booking: ExportBooking & { shipping_line?: Organization }
  onViewDetails?: (booking: ExportBooking) => void
  onRequestCod?: (booking: ExportBooking) => void
  onPayCodFee?: (booking: ExportBooking) => void
  onConfirmCodDelivery?: (booking: ExportBooking) => void
  onConfirmDepotCompletion?: (booking: ExportBooking) => void
  onRequestReuse?: (booking: ExportBooking) => void
}

export function BookingCard({ 
  booking, 
  onViewDetails,
  onRequestCod,
  onPayCodFee,
  onConfirmCodDelivery,
  onConfirmDepotCompletion,
  onRequestReuse
}: BookingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const statusMap = {
    'AVAILABLE': { text: 'Lệnh mới tạo', variant: 'new-order' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'AWAITING_REUSE_APPROVAL': { text: 'Chờ duyệt Re-use', variant: 'pending-reuse' as const, bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'AWAITING_COD_APPROVAL': { text: 'Chờ duyệt thay đổi địa điểm', variant: 'pending-cod' as const, bg: 'bg-orange-50', border: 'border-orange-200' },
    'AWAITING_COD_PAYMENT': { text: 'Chờ thanh toán phí thay đổi địa điểm', variant: 'pending-cod-payment' as const, bg: 'bg-orange-50', border: 'border-orange-200' },
    'AWAITING_REUSE_PAYMENT': { text: 'Chờ thanh toán phí Re-use', variant: 'pending-reuse-payment' as const, bg: 'bg-orange-50', border: 'border-orange-200' },
    'ON_GOING_COD': { text: 'Đang thực hiện thay đổi địa điểm', variant: 'processing-cod' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
    'ON_GOING_REUSE': { text: 'Đang thực hiện Re-use', variant: 'processing-reuse' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
    'DEPOT_PROCESSING': { text: 'Đang xử lý tại Depot', variant: 'processing-depot' as const, bg: 'bg-purple-50', border: 'border-purple-200' },
    'COMPLETED': { text: 'Hoàn tất', variant: 'completed' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'COD_REJECTED': { text: 'Bị từ chối thay đổi địa điểm', variant: 'declined-cod' as const, bg: 'bg-red-50', border: 'border-red-200' },
    'REUSE_REJECTED': { text: 'Bị từ chối Re-use', variant: 'declined-reuse' as const, bg: 'bg-red-50', border: 'border-red-200' },
  }

  const getStatusInfo = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      variant: 'outline' as const, 
      bg: 'bg-gray-50', 
      border: 'border-gray-200' 
    }
  }

  const statusInfo = getStatusInfo(booking.status)

  // Xác định các action có thể thực hiện dựa trên status
  const getAvailableActions = () => {
    const actions: any[] = []

    // Các action theo status
    switch (booking.status) {
      case 'AVAILABLE':
        if (onRequestCod) {
          actions.push({
            id: 'request-cod',
            label: 'Yêu cầu thay đổi địa điểm',
            variant: 'default' as const,
            icon: MapPinIcon,
            onClick: () => onRequestCod(booking),
            priority: 'high'
          })
        }
        if (onRequestReuse) {
          actions.push({
            id: 'request-reuse',
            label: 'Tìm Re-use',
            variant: 'secondary' as const,
            icon: ArrowRightLeft,
            onClick: () => onRequestReuse(booking),
            priority: 'medium'
          })
        }
        break

      case 'AWAITING_COD_PAYMENT':
        if (onPayCodFee) {
          actions.push({
            id: 'pay-cod',
            label: 'Thanh toán phí thay đổi địa điểm',
            variant: 'default' as const,
            icon: CreditCard,
            onClick: () => onPayCodFee(booking),
            priority: 'high'
          })
        }
        break

      case 'ON_GOING_COD':
        if (onConfirmCodDelivery) {
          actions.push({
            id: 'confirm-cod',
            label: 'Xác nhận giao hàng',
            variant: 'default' as const,
            icon: CheckCircle,
            onClick: () => onConfirmCodDelivery(booking),
            priority: 'high'
          })
        }
        break

      case 'DEPOT_PROCESSING':
        if (onConfirmDepotCompletion) {
          actions.push({
            id: 'confirm-depot',
            label: 'Xác nhận hoàn tất',
            variant: 'default' as const,
            icon: CheckCircle,
            onClick: () => setConfirmDialogOpen(true),
            priority: 'high'
          })
        }
        break
    }

    return actions
  }

  const availableActions = getAvailableActions()

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${statusInfo.bg} ${statusInfo.border} border-2`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header với booking number và status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Container className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    {booking.booking_number}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {booking.shipping_line?.name || 'N/A'}
                </div>
              </div>
              <Badge variant={statusInfo.variant} className="ml-2">
                {statusInfo.text}
              </Badge>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-gray-600">Lấy tại</div>
                  <div className="font-medium">{booking.pick_up_location}</div>
                </div>
              </div>
            </div>

            {/* Thời gian */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Cần trước:</span>
              <span className="font-medium">
                {formatStoredDateTimeVN(booking.needed_by_datetime)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {/* Button Xem chi tiết luôn hiển thị */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetailModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem chi tiết
                </Button>
                
                {/* Các action buttons khác */}
                {availableActions
                  .filter(action => action.id !== 'view-details')
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 }
                    return priorityOrder[b.priority] - priorityOrder[a.priority]
                  })
                  .map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant}
                      size="sm"
                      onClick={action.onClick}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      <action.icon className="w-3 h-3 mr-1" />
                      {action.label}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      
      {/* Detail Modal */}
      <OrderDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        booking={booking}
        onRequestCod={onRequestCod}
        onPayCodFee={onPayCodFee}
        onConfirmCodDelivery={onConfirmCodDelivery}
        onConfirmDepotCompletion={onConfirmDepotCompletion as unknown as (item: ImportContainer) => void}
        onRequestReuse={onRequestReuse}
      />
    </>
  )
}

interface PickupOrderCardProps {
  booking: ExportBooking & { shipping_line?: Organization }
  onViewDetails?: (booking: ExportBooking) => void
  onRequestReuse?: (booking: ExportBooking) => void
}

export function PickupOrderCard({ 
  booking, 
  onViewDetails,
  onRequestReuse
}: PickupOrderCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const statusMap = {
    'AVAILABLE': { text: 'Lệnh mới tạo', variant: 'new-order' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'AWAITING_APPROVAL': { text: 'Chờ duyệt Re-use', variant: 'pending-reuse' as const, bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'CONFIRMED': { text: 'Đã ghép', variant: 'processing-reuse' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
  }

  const getStatusInfo = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      variant: 'outline' as const, 
      bg: 'bg-gray-50', 
      border: 'border-gray-200' 
    }
  }

  // Check if booking is near deadline (within 24 hours)
  const isNearDeadline = () => {
    const now = new Date()
    const deadline = new Date(booking.needed_by_datetime)
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    return diffHours <= 24 && diffHours > 0
  }

  const statusInfo = getStatusInfo(booking.status)
  const nearDeadline = isNearDeadline()

  // Xác định các action có thể thực hiện dựa trên status
  const getAvailableActions = () => {
    const actions: any[] = []

    // Không thêm nút xem chi tiết vào actions array vì đã có button riêng biệt

    // Các action theo status
    switch (booking.status) {
      case 'AVAILABLE':
        if (onRequestReuse) {
          actions.push({
            id: 'request-reuse',
            label: 'Tìm Re-use',
            variant: 'default' as const,
            icon: ArrowRightLeft,
            onClick: () => onRequestReuse(booking),
            priority: 'high'
          })
        }
        break

      case 'AWAITING_REUSE_APPROVAL':
        // Chờ admin duyệt, không có action cho dispatcher
        break

      case 'ON_GOING_REUSE':
        // Đã ghép, có thể xem chi tiết
        break

      default:
        break
    }

    return actions
  }

  const availableActions = getAvailableActions()

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${statusInfo.bg} ${statusInfo.border} border-2 ${nearDeadline ? 'ring-2 ring-red-200' : ''}`}>
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header with Truck Icon */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-text-primary text-lg">{booking.booking_number}</div>
                <Badge variant="outline" className="mt-1 bg-white/80">{booking.required_container_type}</Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={statusInfo.variant} className="shadow-sm">{statusInfo.text}</Badge>
              {nearDeadline && (
                <Badge variant="destructive" className="text-xs animate-pulse px-2 py-1">Gấp!</Badge>
              )}
            </div>
          </div>
          
          {/* Shipping Line */}
          <div className="rounded-lg p-3">
            <div className="text-sm text-gray-600 font-medium">Hãng tàu</div>
            <div className="text-text-primary font-semibold">{booking.shipping_line?.name || 'N/A'}</div>
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="font-medium">{booking.pick_up_location}</span>
          </div>
          
          {/* Time */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${nearDeadline ? 'bg-red-100' : 'bg-blue-100'}`}>
              <Clock className={`w-4 h-4 ${nearDeadline ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Cần trước lúc</div>
              <div className={`font-medium ${nearDeadline ? 'text-red-600' : 'text-text-secondary'}`}>
                {formatStoredDateTimeVN(booking.needed_by_datetime)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {/* Button Xem chi tiết luôn hiển thị */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDetailModalOpen(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                Xem chi tiết
              </Button>
              
              {/* Các action buttons khác */}
              {availableActions
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1 }
                  return priorityOrder[b.priority] - priorityOrder[a.priority]
                })
                .map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    size="sm"
                    onClick={action.onClick}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <action.icon className="w-3 h-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Detail Modal */}
      <OrderDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        booking={booking}
        onRequestReuse={onRequestReuse}
      />
    </Card>
  )
}

interface MatchSuggestion {
  import_container: ImportContainer & { shipping_line?: { name: string } }
  export_booking: ExportBooking
  estimated_cost_saving: number
  estimated_co2_saving_kg: number
}

interface ReuseCardProps {
  suggestion: MatchSuggestion
  onCreateReuseRequest?: (suggestion: MatchSuggestion) => void
  onViewDetails?: (suggestion: MatchSuggestion) => void
}

export function ReuseCard({ 
  suggestion, 
  onCreateReuseRequest,
  onViewDetails
}: ReuseCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Xác định các action có thể thực hiện
  const getAvailableActions = () => {
    const actions: any[] = []

    // Không thêm nút xem chi tiết vào actions array vì đã có button riêng biệt

    // Nút tạo yêu cầu Re-use
    if (onCreateReuseRequest) {
      actions.push({
        id: 'create-reuse-request',
        label: 'Tạo yêu cầu Re-use',
        variant: 'default' as const,
        icon: ArrowRightLeft,
        onClick: async () => {
          setIsLoading(true)
          try {
            await onCreateReuseRequest(suggestion)
          } finally {
            setIsLoading(false)
          }
        },
        priority: 'high'
      })
    }

    return actions
  }

  const availableActions = getAvailableActions()

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Gợi ý ghép nối</div>
              <div className="text-text-primary font-semibold">Re-use container</div>
            </div>
          </div>
          
          {/* Lệnh Trả Rỗng */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Container className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Giao trả</span>
            </div>
            <div className="font-bold text-text-primary">{suggestion.import_container.container_number}</div>
            <div className="text-sm text-blue-700 mt-1">{suggestion.import_container.drop_off_location}</div>
          </div>
                    
          {/* Lệnh Lấy Rỗng */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-100 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Lấy rỗng</span>
            </div>
            <div className="font-bold text-text-primary">{suggestion.export_booking.booking_number}</div>
            <div className="text-sm text-yellow-700 mt-1">{suggestion.export_booking.pick_up_location}</div>
          </div>
          
          {/* Benefits */}
          <div className="rounded-xl p-4 border border-white/50">
            <div className="text-sm font-medium text-gray-700 mb-3">Lợi ích dự kiến</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-green-100 rounded-lg">
                <div className="text-xs text-green-600 font-medium">Tiết kiệm chi phí</div>
                <div className="text-green-700 font-bold text-lg">${suggestion.estimated_cost_saving}</div>
              </div>
              <div className="text-center p-2 bg-emerald-100 rounded-lg">
                <div className="text-xs text-emerald-600 font-medium">Tiết kiệm CO₂</div>
                <div className="text-emerald-700 font-bold text-lg">{suggestion.estimated_co2_saving_kg}kg</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {availableActions.length > 0 && (
            <div className="pt-3 border-t border-emerald-200">
              <div className="flex flex-wrap gap-2">
                {availableActions
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 }
                    return priorityOrder[b.priority] - priorityOrder[a.priority]
                  })
                  .map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant}
                      size="sm"
                      onClick={action.onClick}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      <action.icon className="w-3 h-3 mr-1" />
                      {action.label}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}