import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ExportBooking, Organization } from '@/lib/types'

interface ExportBookingsTableProps {
  bookings: (ExportBooking & {
    shipping_line?: Organization
    container_type?: any // Can be string or object from joined data
  })[]
}

export default function ExportBookingsTable({ bookings }: ExportBookingsTableProps) {
  // Status mapping cho booking
  const statusMap = {
    'AVAILABLE': { text: 'Sẵn sàng', variant: 'approved' as const },
    'AWAITING_APPROVAL': { text: 'Chờ duyệt', variant: 'pending' as const },
    'CONFIRMED': { text: 'Đã ghép', variant: 'info' as const },
  }

  const getStatusBadge = (status: string) => {
    const currentStatus = statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const }
    return <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
  }

  return (
    <Card className="mb-8">      
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <p>Chưa có lệnh lấy rỗng nào.</p>
            <p className="text-sm mt-2">Hãy thêm lệnh đầu tiên để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-text-primary">Số Booking</th>
                  <th className="text-left p-3 font-medium text-text-primary">Loại Container</th>
                  <th className="text-left p-3 font-medium text-text-primary">Hãng Tàu</th>
                  <th className="text-left p-3 font-medium text-text-primary">Địa Điểm Lấy Hàng</th>
                  <th className="text-left p-3 font-medium text-text-primary">Thời Gian Cần</th>
                  <th className="text-center p-3 font-medium text-text-primary">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-border hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-text-primary">
                        {booking.booking_number}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {booking.container_type?.code || booking.required_container_type || 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-3 text-text-secondary">
                      {booking.shipping_line?.name || 'N/A'}
                    </td>
                    <td className="p-3 text-text-secondary">
                      {booking.pick_up_location}
                    </td>
                    <td className="p-3 text-text-secondary">
                      {formatStoredDateTimeVN(booking.needed_by_datetime)}
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
  )
} 