'use client'

import { useDashboardStore } from '@/stores/dashboard-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Container, MapPin, Calendar, Clock, Building, Eye, MapPin as MapPinIcon, CreditCard, CheckCircle, ArrowRightLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { formatDistanceStrict, differenceInHours, isAfter } from 'date-fns'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useState } from 'react'
import { ConfirmCodCompletionDialog } from '@/components/features/cod/ConfirmCodCompletionDialog'

interface FullDropOffOrdersTableProps {
  importContainers: any[]
  onViewDetails?: (container: any) => void
  onRequestCod?: (container: any) => void
  onPayCodFee?: (container: any) => void
  onConfirmCodDelivery?: (container: any) => void
  onConfirmDepotCompletion?: (container: any) => void
  onRequestReuse?: (container: any) => void
}

const IMPORT_CONTAINER_STATUS = [
  'AVAILABLE',
  'AWAITING_REUSE_APPROVAL',
  'COD_REJECTED',
  'AWAITING_COD_APPROVAL',
  'AWAITING_COD_PAYMENT',
  'AWAITING_REUSE_PAYMENT',
  'ON_GOING_COD',
  'ON_GOING_REUSE',
  'DEPOT_PROCESSING',
  'COMPLETED',
  'REUSE_REJECTED',
  'EXPIRED',
  'PAYMENT_CANCELLED'
] as const;
type ImportContainerStatus = typeof IMPORT_CONTAINER_STATUS[number];

const statusMap: Record<ImportContainerStatus, { text: string; variant: "default" | "warning" | "info" | "secondary" | "accent" | "destructive" | "approved" | "outline" | "pending" | "declined" | "confirmed" | "new-order" | "pending-reuse" | "pending-cod" | "pending-cod-payment" | "pending-reuse-payment" | "processing-cod" | "processing-reuse" | "processing-depot" | "completed" | "declined-cod" | "declined-reuse"; bg: string; border: string }> = {
  AVAILABLE: { text: 'Lệnh mới tạo', variant: 'new-order', bg: 'bg-green-50', border: 'border-green-200' },
  AWAITING_REUSE_APPROVAL: { text: 'Chờ duyệt Re-use', variant: 'pending-reuse', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  COD_REJECTED: { text: 'Bị từ chối Thay Đổi Địa Điểm', variant: 'declined-cod', bg: 'bg-red-50', border: 'border-red-200' },
  AWAITING_COD_APPROVAL: { text: 'Chờ duyệt Thay Đổi Địa Điểm', variant: 'pending-cod', bg: 'bg-orange-50', border: 'border-orange-200' },
  AWAITING_COD_PAYMENT: { text: 'Chờ thanh toán phí Thay Đổi Địa Điểm', variant: 'pending-cod-payment', bg: 'bg-orange-50', border: 'border-orange-200' },
  AWAITING_REUSE_PAYMENT: { text: 'Chờ thanh toán phí Re-use', variant: 'pending-reuse-payment', bg: 'bg-orange-50', border: 'border-orange-200' },
  ON_GOING_COD: { text: 'Đang thực hiện Thay Đổi Địa Điểm', variant: 'processing-cod', bg: 'bg-blue-50', border: 'border-blue-200' },
  ON_GOING_REUSE: { text: 'Đang thực hiện Re-use', variant: 'processing-reuse', bg: 'bg-blue-50', border: 'border-blue-200' },
  DEPOT_PROCESSING: { text: 'Đang xử lý tại Depot', variant: 'processing-depot', bg: 'bg-purple-50', border: 'border-purple-200' },
  COMPLETED: { text: 'Hoàn tất', variant: 'completed', bg: 'bg-green-50', border: 'border-green-200' },
  REUSE_REJECTED: { text: 'Bị từ chối Re-use', variant: 'declined-reuse', bg: 'bg-red-50', border: 'border-red-200' },
  EXPIRED: { text: 'Hết hạn', variant: 'outline', bg: 'bg-gray-50', border: 'border-gray-200' },
  PAYMENT_CANCELLED: { text: 'Đã hủy thanh toán', variant: 'outline', bg: 'bg-gray-50', border: 'border-gray-200' },
};

const getStatusInfo = (status: string) => {
  return statusMap[status as ImportContainerStatus] || { text: status, variant: 'outline' as const, bg: 'bg-gray-50', border: 'border-gray-200' };
}

export function FullDropOffOrdersTable({ 
  importContainers,
  onViewDetails,
  onRequestCod,
  onPayCodFee,
  onConfirmCodDelivery,
  onConfirmDepotCompletion,
  onRequestReuse
}: FullDropOffOrdersTableProps) {
  const { selectedDropOffOrderId, setSelectedDropOffOrder } = useDashboardStore()
  const [loadingContainerId, setLoadingContainerId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<any>(null)

  const handleOrderClick = (container: any) => {
    setSelectedDropOffOrder(container.id)
  }

  // Xác định các action có thể thực hiện dựa trên status
  const getAvailableActions = (container: any) => {
    const actions: any[] = []

    // Luôn có nút xem chi tiết
    if (onViewDetails) {
      actions.push({
        id: 'view-details',
        label: 'Xem chi tiết',
        variant: 'outline' as const,
        icon: Eye,
        onClick: () => onViewDetails(container),
        priority: 'low'
      })
    }

    // Các action theo status
    switch (container.status) {
      case 'AVAILABLE':
        if (onRequestCod) {
          actions.push({
            id: 'request-cod',
            label: 'Yêu cầu Thay Đổi Địa Điểm',
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
            label: 'Thanh toán Phí Thay Đổi Địa Điểm',
            variant: 'default' as const,
            icon: CreditCard,
            onClick: async () => {
              setLoadingContainerId(container.id)
              try {
                await onPayCodFee(container)
              } finally {
                setLoadingContainerId(null)
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
            label: 'Xác nhận hoàn tất COD',
            variant: 'default' as const,
            icon: CheckCircle,
            onClick: () => {
              setSelectedContainer(container)
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
              setLoadingContainerId(container.id)
              try {
                await onConfirmDepotCompletion(container)
              } finally {
                setLoadingContainerId(null)
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
            label: 'Yêu cầu Thay Đổi Địa Điểm lại',
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

  const handleConfirmCodCompletion = async () => {
    if (!selectedContainer || !onConfirmCodDelivery) return
    
    setLoadingContainerId(selectedContainer.id)
    try {
      await onConfirmCodDelivery(selectedContainer)
    } finally {
      setLoadingContainerId(null)
    }
  }

  /**
   * Tính toán mức độ khẩn cấp dựa trên thời gian còn lại
   * @param availableFrom - Thời gian hết hạn
   * @returns Object chứa level và số phút còn lại
   */
  const getUrgencyLevel = (availableFrom: string) => {
    if (!availableFrom) return { level: 'none', minutes: null }
    const availableDate = new Date(availableFrom)
    const now = new Date()
    const diffMinutes = Math.round((availableDate.getTime() - now.getTime()) / (1000 * 60))
    const diffHours = Math.round(diffMinutes / 60)
    
    if (diffHours <= 24 && diffHours >= 0) return { level: 'high', minutes: diffMinutes }
    if (diffHours <= 72 && diffHours > 24) return { level: 'medium', minutes: diffMinutes }
    return { level: 'none', minutes: diffMinutes }
  }

  /**
   * Format thời gian còn lại theo định dạng yêu cầu
   * @param minutes - Số phút còn lại
   * @returns Chuỗi thời gian đã format
   */
  const formatRemainingTime = (minutes: number | null): string => {
    if (minutes === null || minutes < 0) return '0 phút'
    
    const days = Math.floor(minutes / (24 * 60))
    const hours = Math.floor((minutes % (24 * 60)) / 60)
    const mins = minutes % 60
    
    if (days > 0) {
      // Hiển thị ngày giờ phút
      return `${days} ngày ${hours} giờ ${mins} phút`
    } else if (hours > 0) {
      // Hiển thị giờ phút (nếu còn ít hơn 1 ngày)
      return `${hours} giờ ${mins} phút`
    } else {
      // Hiển thị chỉ phút (nếu còn ít hơn 1 giờ)
      return `${mins} phút`
    }
  }

  /**
   * Hiển thị badge cảnh báo tới hạn trả rỗng
   * @param urgency - Mức độ khẩn cấp và thời gian còn lại
   * @param containerStatus - Trạng thái hiện tại của container
   * @returns Badge component hoặc null
   */
  const getUrgencyBadge = (urgency: { level: string, minutes: number | null }, containerStatus: string) => {
    // Không hiển thị badge cảnh báo khi container đã ở trạng thái "Đang xử lý tại Depot" trở về sau
    if (containerStatus === 'DEPOT_PROCESSING' || containerStatus === 'COMPLETED') {
      return null
    }
    
    if (urgency.level === 'high') {
      const timeText = formatRemainingTime(urgency.minutes)
      return <Badge className="bg-red-600 text-white font-bold animate-pulse text-xs px-2 py-1">GẤP: Còn {timeText}</Badge>
    }
    if (urgency.level === 'medium') {
      const timeText = formatRemainingTime(urgency.minutes)
      return <Badge className="bg-yellow-400 text-black font-semibold text-xs px-2 py-1">Còn {timeText} tới hạn trả rỗng</Badge>
    }
    return null
  }

  const getTimeAgo = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: vi 
    });
  }

  if (importContainers.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Container className="w-5 h-5 text-primary" />
            Lệnh Trả Rỗng
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Container className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Chưa có Lệnh Trả Rỗng
            </h3>
            <p className="text-text-secondary text-sm">
              Chưa có lệnh trả rỗng nào trong hệ thống
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col p-2">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Container className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Tất Cả Lệnh Trả Rỗng
              </h2>
              <p className="text-sm text-text-secondary">
                {importContainers.length} container đang quản lý
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            {importContainers.length} container
          </Badge>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto flex-1 pr-2">
        {importContainers.map((container) => {
          const statusInfo = getStatusInfo(container.status)
          const isSelected = selectedDropOffOrderId === container.id
          const availableActions = getAvailableActions(container)
          const isLoading = loadingContainerId === container.id
          
          return (
            <Card 
              key={container.id}
              className={`relative cursor-pointer transition-all duration-300 
                ${isSelected ? 'border-4 border-primary ring-4 ring-primary/20 shadow-2xl bg-primary/5' : 'hover:border-primary/40 hover:shadow-lg hover:scale-[1.01] border border-gray-200'} 
                ${statusInfo.bg} ${statusInfo.border}`}
              onClick={() => handleOrderClick(container)}
            >
              {/* Accent bar trái khi selected */}
              {isSelected && (
                <div className="absolute left-0 top-0 h-full w-2 bg-primary rounded-l-lg animate-pulse z-10" />
              )}
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Container className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-text-primary text-lg">
                          {container.container_number}
                        </div>
                        <Badge variant="outline" className="mt-1 bg-white/80">
                          {container.container_type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(getUrgencyLevel(container.available_from_datetime), container.status)}
                      <div className="text-right">
                        <Badge variant={statusInfo.variant} className="mb-1">
                          {statusInfo.text}
                        </Badge>
                        <div className="text-xs text-text-secondary">
                          {getTimeAgo(container.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Info - Đưa lên trên */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-text-primary">Depot trả rỗng:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate block max-w-xs">{container.original_depot_name}</span>

                          </TooltipTrigger>
                          <TooltipContent>
                            <span>{container.original_depot_name}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-text-primary">Hạn trả rỗng:</span>
                      <span className="text-text-primary">
                        {container.available_from_datetime 
                          ? new Date(container.available_from_datetime).toLocaleString('vi-VN')
                          : 'Linh hoạt'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {availableActions.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
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
                              onClick={(e) => {
                                e.stopPropagation() // Ngăn không cho card bị click
                                action.onClick()
                              }}
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
        })}
        
        {/* Confirmation Dialog */}
        <ConfirmCodCompletionDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          container={selectedContainer}
          onConfirm={handleConfirmCodCompletion}
          isLoading={loadingContainerId === selectedContainer?.id}
        />
      </div>
    </div>
  )
}

/**
 * Skeleton UI cho bảng lệnh trả rỗng, dùng cho Suspense fallback
 */
export function FullDropOffOrdersTableSkeleton() {
  return (
    <div className="h-full flex flex-col p-2 animate-pulse">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-4 flex-1 pr-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="h-3 w-48 bg-gray-100 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}