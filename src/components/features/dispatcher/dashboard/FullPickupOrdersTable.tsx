'use client'

import { useDashboardStore } from '@/stores/dashboard-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Truck, MapPin, Calendar, Clock, Package, Eye, ArrowRightLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { formatDateTimeVNNoSeconds } from '@/lib/utils'
import { useState } from 'react'

interface FullPickupOrdersTableProps {
  exportBookings: any[]
  onViewDetails?: (booking: any) => void
  onRequestReuse?: (booking: any) => void
}

export function FullPickupOrdersTable({ 
  exportBookings,
  onViewDetails,
  onRequestReuse
}: FullPickupOrdersTableProps) {
  const { selectedPickupOrderId, setSelectedPickupOrder } = useDashboardStore()
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null)

  const handleOrderClick = (booking: any) => {
    setSelectedPickupOrder(booking.id)
  }

  // Xác định các action có thể thực hiện dựa trên status
  const getAvailableActions = (booking: any) => {
    const actions: any[] = []

    // Luôn có nút xem chi tiết
    if (onViewDetails) {
      actions.push({
        id: 'view-details',
        label: 'Xem chi tiết',
        variant: 'outline' as const,
        icon: Eye,
        onClick: () => onViewDetails(booking),
        priority: 'low'
      })
    }

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

      case 'IN_PROGRESS':
        // Đang thực hiện, có thể xem chi tiết
        break

      case 'COMPLETED':
        // Hoàn thành, có thể xem chi tiết
        break

      default:
        break
    }

    return actions
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          text: 'Sẵn sàng',
          variant: 'default' as const,
          bg: 'bg-green-50',
          border: 'border-green-200'
        }
      case 'IN_PROGRESS':
        return {
          text: 'Đang thực hiện',
          variant: 'secondary' as const,
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        }
      case 'COMPLETED':
        return {
          text: 'Hoàn thành',
          variant: 'outline' as const,
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        }
      default:
        return {
          text: status,
          variant: 'outline' as const,
          bg: 'bg-gray-50',
          border: 'border-gray-200'
        }
    }
  }

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return {
          text: 'Cao',
          variant: 'destructive' as const,
          bg: 'bg-red-100',
          border: 'border-red-300'
        }
      case 'MEDIUM':
        return {
          text: 'Trung bình',
          variant: 'secondary' as const,
          bg: 'bg-yellow-100',
          border: 'border-yellow-300'
        }
      case 'LOW':
        return {
          text: 'Thấp',
          variant: 'outline' as const,
          bg: 'bg-green-100',
          border: 'border-green-300'
        }
      default:
        return {
          text: 'Trung bình',
          variant: 'secondary' as const,
          bg: 'bg-yellow-100',
          border: 'border-yellow-300'
        }
    }
  }

  // Check if booking is near deadline (within 24 hours)
  const isNearDeadline = (neededBy: string) => {
    const deadline = new Date(neededBy)
    const now = new Date()
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilDeadline <= 24 && hoursUntilDeadline > 0
  }

  if (exportBookings.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-warning" />
            Lệnh Lấy Rỗng
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
              <Truck className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Chưa có Lệnh Lấy Rỗng
            </h3>
            <p className="text-text-secondary text-sm">
              Chưa có lệnh lấy rỗng nào trong hệ thống
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Tất Cả Lệnh Lấy Rỗng
              </h2>
              <p className="text-sm text-text-secondary">
                {exportBookings.length} booking đang quản lý
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            {exportBookings.length} booking
          </Badge>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto h-[calc(100%-100px)] pr-2">
        {exportBookings.map((booking) => {
          const statusInfo = getStatusInfo(booking.status)
          const nearDeadline = booking.needed_by_datetime && isNearDeadline(booking.needed_by_datetime)
          const availableActions = getAvailableActions(booking)
          const isLoading = loadingBookingId === booking.id
          
          return (
            <Card 
              key={booking.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${statusInfo.bg} ${statusInfo.border} border-2 ${
                selectedPickupOrderId === booking.id 
                  ? 'ring-2 ring-orange-300 shadow-lg' 
                  : ''
              } ${nearDeadline ? 'ring-2 ring-red-200' : ''}`}
              onClick={() => handleOrderClick(booking)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-text-primary text-lg">
                          {booking.booking_number}
                        </div>
                        <Badge variant="outline" className="mt-1 bg-white/80">
                          {booking.required_container_type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusInfo.variant} className="shadow-sm">
                        {statusInfo.text}
                      </Badge>
                      {nearDeadline && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          Gấp!
                        </Badge>
                      )}
                      <div className="text-xs text-text-secondary">
                        {formatDistanceToNow(new Date(booking.created_at), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="flex items-center gap-3 text-text-secondary">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-secondary">Điểm lấy container</p>
                      <p className="text-text-primary font-semibold truncate">
                        {booking.pick_up_location || 'Chưa xác định'}
                      </p>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className="flex items-center gap-3 text-text-secondary">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-secondary">Thời gian cần</p>
                      <p className={`font-semibold ${nearDeadline ? 'text-red-600' : 'text-text-primary'}`}>
                        {booking.needed_by_datetime 
                          ? formatDateTimeVNNoSeconds(booking.needed_by_datetime)
                          : 'Linh hoạt'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-text-secondary">Hãng tàu</p>
                      <p className="text-sm font-medium text-text-primary">
                        {booking.shipping_line?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-secondary">Được tạo</p>
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                      </p>
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

                  {/* Action Indicator */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Calendar className="w-3 h-3" />
                      <span>ID: {booking.id.slice(0, 8)}...</span>
                    </div>
                    <div className="text-xs text-primary font-medium">
                      Click để xem container phù hợp →
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 

/**
 * Skeleton UI cho bảng lệnh lấy rỗng, dùng cho Suspense fallback
 */
export function FullPickupOrdersTableSkeleton() {
  return (
    <div className="h-full flex flex-col p-2 animate-pulse">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-4 flex-1 pr-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl" />
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