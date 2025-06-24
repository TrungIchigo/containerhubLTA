import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ExportBooking, Organization } from '@/lib/types'
import { useState } from 'react'
import BookingDetailDialog from './BookingDetailDialog'

interface ExportBookingsTableProps {
  bookings: (ExportBooking & {
    shipping_line?: Organization
    container_type?: any // Can be string or object from joined data
  })[]
}

export default function ExportBookingsTable({ bookings }: ExportBookingsTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<ExportBooking | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

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

  const handleViewDetails = (booking: ExportBooking) => {
    setSelectedBooking(booking)
    setIsDetailDialogOpen(true)
  }

    return (
    <>
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
                    <th className="text-center p-3 font-medium text-text-primary w-24">Hành Động</th>
                  </tr>
                </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-border hover:bg-gray-50">
                        <td 
                          className="p-3 cursor-pointer hover:bg-blue-50"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <div className="font-medium text-text-primary hover:text-blue-600">
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
                        <td className="p-3 text-center w-24">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(booking)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Xem Chi Tiết
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      {selectedBooking && (
        <BookingDetailDialog
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false)
            setSelectedBooking(null)
          }}
          booking={selectedBooking as any}
          onUpdate={() => {
            // Callback to refresh data after edit/delete
            setIsDetailDialogOpen(false)
            setSelectedBooking(null)
            // The parent component would need to handle refresh
          }}
        />
      )}
    </>
  )
} 