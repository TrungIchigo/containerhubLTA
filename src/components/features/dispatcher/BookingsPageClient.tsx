'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, MapPin, Calendar } from 'lucide-react'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ExportBookingWithOrg, ContainerType, Organization } from '@/lib/types'
import BookingFilters, { BookingFilterOptions } from './BookingFilters'

interface BookingsPageClientProps {
  bookings: ExportBookingWithOrg[]
  containerTypes: ContainerType[]
  shippingLines: Organization[]
}

export default function BookingsPageClient({
  bookings,
  containerTypes, 
  shippingLines
}: BookingsPageClientProps) {
  const [filters, setFilters] = useState<BookingFilterOptions>({})

  // Filter logic
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Filter by container type
      if (filters.containerTypeId && booking.container_type_id !== filters.containerTypeId) {
        return false
      }

      // Filter by shipping line (for bookings, this might be inferred from trucking company relationships)
      if (filters.shippingLineId) {
        // Note: We might need to add shipping line relationship to export_bookings table
        // For now, we'll skip this filter for bookings
      }

      // Filter by needed by date
      if (filters.neededByDate) {
        const bookingDate = new Date(booking.needed_by_datetime).toISOString().split('T')[0]
        if (bookingDate > filters.neededByDate) {
          return false
        }
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const bookingNumber = booking.booking_number.toLowerCase()
        const location = booking.pick_up_location.toLowerCase()
        if (!bookingNumber.includes(query) && !location.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [bookings, filters])

  const statusMap = {
    'AVAILABLE': { text: 'Cần container', variant: 'pending' as const },
    'AWAITING_APPROVAL': { text: 'Chờ duyệt', variant: 'pending' as const },
    'CONFIRMED': { text: 'Đã ghép', variant: 'approved' as const },
  }

  const getStatusBadge = (status: string) => {
    const currentStatus = statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const }
    return <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
  }

  // Get container type display text
  const getContainerTypeDisplay = (booking: ExportBookingWithOrg) => {
    if (booking.container_type_id) {
      const type = containerTypes.find(t => t.id === booking.container_type_id)
      return type ? `${type.code}` : booking.required_container_type
    }
    return booking.required_container_type
  }

  return (
    <>
      {/* Filters */}
      <BookingFilters
        containerTypes={containerTypes}
        shippingLines={shippingLines}
        onFilter={setFilters}
      />

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 p-3">
            <FileText className="h-5 w-5" />
            Danh Sách Booking Đang Chờ ({filteredBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <FileText className="h-12 w-12 mx-auto mb-4 text-text-secondary" />
              <p className="text-lg font-medium mb-2">
                {filters.containerTypeId || filters.neededByDate || filters.searchQuery
                  ? 'Không tìm thấy booking phù hợp'
                  : 'Không có booking đang chờ'
                }
              </p>
              <p>
                {filters.containerTypeId || filters.neededByDate || filters.searchQuery
                  ? 'Thử điều chỉnh bộ lọc để xem thêm kết quả'
                  : 'Tất cả booking đã được xử lý hoặc ghép container'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-text-primary">Booking</th>
                    <th className="text-left p-3 font-medium text-text-primary">Container & Hãng Tàu</th>
                    <th className="text-left p-3 font-medium text-text-primary">Địa Điểm</th>
                    <th className="text-left p-3 font-medium text-text-primary">Thời Gian</th>
                    <th className="text-left p-3 font-medium text-text-primary">Tài Liệu</th>
                    <th className="text-center p-3 font-medium text-text-primary">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border hover:bg-gray-50">
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="font-medium text-text-primary">
                            {booking.booking_number}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-2">
                          <Badge variant="outline">
                            {getContainerTypeDisplay(booking)}
                          </Badge>
                          <div className="text-sm text-text-secondary">
                            {booking.trucking_company?.name || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-text-primary">
                            {booking.pick_up_location}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-text-primary flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Cần trước
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatStoredDateTimeVN(booking.needed_by_datetime)}
                          </div>
                          <div className="text-xs text-text-secondary">
                            Tạo: {formatStoredDateTimeVN(booking.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {booking.attached_documents && booking.attached_documents.length > 0 ? (
                            <div className="text-xs text-blue-600 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {booking.attached_documents.length} tài liệu
                            </div>
                          ) : (
                            <div className="text-xs text-text-secondary">Chưa có tài liệu</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(booking.status)}
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