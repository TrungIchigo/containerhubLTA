'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container, MapPin, Calendar, FileText } from 'lucide-react'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ImportContainerWithOrgs, ContainerType, Organization } from '@/lib/types'
import ContainerFilters, { ContainerFilterOptions } from './ContainerFilters'

interface ContainersPageClientProps {
  containers: ImportContainerWithOrgs[]
  containerTypes: ContainerType[]
  shippingLines: Organization[]
}

export default function ContainersPageClient({
  containers,
  containerTypes, 
  shippingLines
}: ContainersPageClientProps) {
  const [filters, setFilters] = useState<ContainerFilterOptions>({})

  // Filter logic
  const filteredContainers = useMemo(() => {
    return containers.filter(container => {
      // Filter by container type
      if (filters.containerTypeId && container.container_type_id !== filters.containerTypeId) {
        return false
      }

      // Filter by shipping line
      if (filters.shippingLineId && container.shipping_line_org_id !== filters.shippingLineId) {
        return false
      }

      // Filter by available from date
      if (filters.availableFromDate) {
        const containerDate = new Date(container.available_from_datetime).toISOString().split('T')[0]
        if (containerDate < filters.availableFromDate) {
          return false
        }
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const containerNumber = container.container_number.toLowerCase()
        const location = container.drop_off_location.toLowerCase()
        if (!containerNumber.includes(query) && !location.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [containers, filters])

  // Status mapping cho container
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

  const statusMap: Record<ImportContainerStatus, { text: string; variant: "default" | "warning" | "info" | "secondary" | "accent" | "destructive" | "approved" | "outline" | "pending" | "declined" | "confirmed" }> = {
    AVAILABLE: { text: 'Sẵn sàng', variant: 'approved' },
    AWAITING_REUSE_APPROVAL: { text: 'Chờ duyệt Re-use', variant: 'pending' },
    COD_REJECTED: { text: 'Bị từ chối COD', variant: 'destructive' },
    AWAITING_COD_APPROVAL: { text: 'Chờ duyệt COD', variant: 'pending' },
    AWAITING_COD_PAYMENT: { text: 'Chờ thanh toán phí COD', variant: 'warning' },
    AWAITING_REUSE_PAYMENT: { text: 'Chờ thanh toán phí Re-use', variant: 'warning' },
    ON_GOING_COD: { text: 'Đang thực hiện COD', variant: 'info' },
  ON_GOING_REUSE: { text: 'Đang thực hiện Re-use', variant: 'info' },
    DEPOT_PROCESSING: { text: 'Đang xử lý tại Depot', variant: 'secondary' },
    COMPLETED: { text: 'Hoàn tất', variant: 'approved' },
    REUSE_REJECTED: { text: 'Bị từ chối Re-use', variant: 'destructive' },
    EXPIRED: { text: 'Hết hạn', variant: 'outline' },
    PAYMENT_CANCELLED: { text: 'Đã hủy thanh toán', variant: 'outline' },
  };

  const getStatusBadge = (status: string) => {
    const currentStatus = statusMap[status as ImportContainerStatus] || { text: status, variant: 'outline' as const };
    const variant = currentStatus.variant as "default" | "warning" | "info" | "secondary" | "accent" | "destructive" | "approved" | "outline" | "pending" | "declined" | "confirmed";
    return <Badge variant={variant}>{currentStatus.text}</Badge>;
  }

  // Get container type display text
  const getContainerTypeDisplay = (container: ImportContainerWithOrgs) => {
    if (container.container_type_id) {
      const type = containerTypes.find(t => t.id === container.container_type_id)
      return type ? `${type.code}` : container.container_type
    }
    return container.container_type
  }

  return (
    <>
      {/* Filters */}
      <ContainerFilters
        containerTypes={containerTypes}
        shippingLines={shippingLines}
        onFilter={setFilters}
      />

      {/* Containers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 p-3">
            <Container className="h-5 w-5" />
            Danh Sách Container Sẵn Sàng ({filteredContainers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {filteredContainers.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <Container className="h-12 w-12 mx-auto mb-4 text-text-secondary" />
              <p className="text-lg font-medium mb-2">
                {filters.containerTypeId || filters.shippingLineId || filters.availableFromDate || filters.searchQuery
                  ? 'Không tìm thấy container phù hợp'
                  : 'Không có container sẵn sàng'
                }
              </p>
              <p>
                {filters.containerTypeId || filters.shippingLineId || filters.availableFromDate || filters.searchQuery
                  ? 'Thử điều chỉnh bộ lọc để xem thêm kết quả'
                  : 'Tất cả container đang được sử dụng hoặc chờ duyệt'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-text-primary">Container</th>
                    <th className="text-left p-3 font-medium text-text-primary">Loại & Hãng Tàu</th>
                    <th className="text-left p-3 font-medium text-text-primary">Địa Điểm</th>
                    <th className="text-left p-3 font-medium text-text-primary">Thời Gian</th>
                    <th className="text-left p-3 font-medium text-text-primary">Tài Liệu</th>
                    <th className="text-center p-3 font-medium text-text-primary w-32">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContainers.map((container) => (
                    <tr key={container.id} className="border-b border-border hover:bg-gray-50">
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="font-medium text-text-primary">
                            {container.container_number}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-2">
                          <Badge variant="outline">
                            {getContainerTypeDisplay(container)}
                          </Badge>
                          <div className="text-sm text-text-secondary">
                            {container.shipping_line?.name || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-text-primary">
                            {container.drop_off_location}
                          </div>
                          {container.latitude && container.longitude && (
                            <div className="text-xs text-text-secondary flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {container.latitude.toFixed(4)}, {container.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-text-primary flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Rảnh từ
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatStoredDateTimeVN(container.available_from_datetime)}
                          </div>
                          <div className="text-xs text-text-secondary">
                            Tạo: {formatStoredDateTimeVN(container.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {container.condition_images && container.condition_images.length > 0 && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {container.condition_images.length} ảnh tình trạng
                            </div>
                          )}
                          {container.attached_documents && container.attached_documents.length > 0 && (
                            <div className="text-xs text-blue-600 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {container.attached_documents.length} tài liệu
                            </div>
                          )}
                          {(!container.condition_images?.length && !container.attached_documents?.length) && (
                            <div className="text-xs text-text-secondary">Không có tài liệu</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center w-32">
                        <div className="whitespace-nowrap">
                          {getStatusBadge(container.status)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}