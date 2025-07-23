'use client'

import { useDashboardStore } from '@/stores/dashboard-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container, MapPin, Calendar, Clock, Building } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface FullDropOffOrdersTableProps {
  importContainers: any[]
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

const statusMap: Record<ImportContainerStatus, { text: string; variant: "default" | "warning" | "info" | "secondary" | "accent" | "destructive" | "approved" | "outline" | "pending" | "declined" | "confirmed"; bg: string; border: string }> = {
  AVAILABLE: { text: 'Sẵn sàng', variant: 'approved', bg: 'bg-green-50', border: 'border-green-200' },
  AWAITING_REUSE_APPROVAL: { text: 'Chờ duyệt tái sử dụng', variant: 'pending', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  COD_REJECTED: { text: 'Bị từ chối COD', variant: 'destructive', bg: 'bg-red-50', border: 'border-red-200' },
  AWAITING_COD_APPROVAL: { text: 'Chờ duyệt COD', variant: 'pending', bg: 'bg-orange-50', border: 'border-orange-200' },
  AWAITING_COD_PAYMENT: { text: 'Chờ thanh toán phí COD', variant: 'warning', bg: 'bg-orange-50', border: 'border-orange-200' },
  AWAITING_REUSE_PAYMENT: { text: 'Chờ thanh toán phí tái sử dụng', variant: 'warning', bg: 'bg-orange-50', border: 'border-orange-200' },
  ON_GOING_COD: { text: 'Đã thanh toán - Đang thực hiện COD', variant: 'info', bg: 'bg-blue-50', border: 'border-blue-200' },
  ON_GOING_REUSE: { text: 'Đã thanh toán - Đang thực hiện Tái sử dụng', variant: 'info', bg: 'bg-blue-50', border: 'border-blue-200' },
  DEPOT_PROCESSING: { text: 'Đang xử lý tại Depot', variant: 'secondary', bg: 'bg-purple-50', border: 'border-purple-200' },
  COMPLETED: { text: 'Hoàn tất', variant: 'approved', bg: 'bg-green-50', border: 'border-green-200' },
  REUSE_REJECTED: { text: 'Bị từ chối tái sử dụng', variant: 'destructive', bg: 'bg-red-50', border: 'border-red-200' },
  EXPIRED: { text: 'Hết hạn', variant: 'outline', bg: 'bg-gray-50', border: 'border-gray-200' },
  PAYMENT_CANCELLED: { text: 'Đã hủy thanh toán', variant: 'outline', bg: 'bg-gray-50', border: 'border-gray-200' },
};

const getStatusInfo = (status: string) => {
  return statusMap[status as ImportContainerStatus] || { text: status, variant: 'outline' as const, bg: 'bg-gray-50', border: 'border-gray-200' };
}

export function FullDropOffOrdersTable({ importContainers }: FullDropOffOrdersTableProps) {
  const { selectedDropOffOrderId, setSelectedDropOffOrder } = useDashboardStore()

  const handleOrderClick = (container: any) => {
    setSelectedDropOffOrder(container.id)
  }

  if (importContainers.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Container className="w-5 h-5 text-primary" />
            Lệnh Giao Trả
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Container className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Chưa có Lệnh Giao Trả
            </h3>
            <p className="text-text-secondary text-sm">
              Chưa có lệnh giao trả nào trong hệ thống
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Container className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Tất Cả Lệnh Giao Trả
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

      <div className="space-y-3 overflow-y-auto h-[calc(100%-100px)] pr-2">
        {importContainers.map((container) => {
          const statusInfo = getStatusInfo(container.status)
          
          return (
            <Card 
              key={container.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${statusInfo.bg} ${statusInfo.border} border-2 ${
                selectedDropOffOrderId === container.id 
                  ? 'ring-2 ring-blue-300 shadow-lg' 
                  : ''
              }`}
              onClick={() => handleOrderClick(container)}
            >
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
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={statusInfo.variant} className="shadow-sm">
                        {statusInfo.text}
                      </Badge>
                      <div className="text-xs text-text-secondary">
                        {formatDistanceToNow(new Date(container.created_at), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="flex items-center gap-3 text-text-secondary">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-secondary">Điểm giao hiện tại</p>
                      <p className="text-text-primary font-semibold truncate">
                        {container.drop_off_location || 'Chưa xác định'}
                      </p>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className="flex items-center gap-3 text-text-secondary">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-secondary">Sẵn sàng từ</p>
                      <p className="text-text-primary font-semibold">
                        {container.available_from_datetime 
                          ? new Date(container.available_from_datetime).toLocaleString('vi-VN')
                          : 'Chưa xác định'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-text-secondary">Hãng tàu</p>
                      <p className="text-sm font-medium text-text-primary">
                        {container.shipping_line?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-text-secondary">Được tạo</p>
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(container.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {/* Action Indicator */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Calendar className="w-3 h-3" />
                      <span>ID: {container.id.slice(0, 8)}...</span>
                    </div>
                    <div className="text-xs text-primary font-medium">
                      Click để xem gợi ý ghép nối →
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