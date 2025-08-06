'use client'

import { useDashboardStore } from '@/stores/dashboard-store'
import { SuggestionDetails } from './SuggestionDetails'
import { RelatedSuggestionsForDropOffOrder } from './RelatedSuggestionsForDropOffOrder'
import { RelatedSuggestionsForPickupOrder } from './RelatedSuggestionsForPickupOrder'
import { DefaultSidebarState } from './DefaultSidebarState'
import { StatusTimeline } from './StatusTimeline'
import { SuggestedActions } from './SuggestedActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Container, ArrowRightLeft, MapPin, Clock } from 'lucide-react'

interface ContextualSidebarProps {
  importContainers: any[]
  exportBookings: any[]
  matchSuggestions: any[]
}

export function ContextualSidebar({ 
  importContainers, 
  exportBookings, 
  matchSuggestions 
}: ContextualSidebarProps) {
  const { 
    selectedSuggestionId, 
    selectedDropOffOrderId, 
    selectedPickupOrderId 
  } = useDashboardStore()

  // Ưu tiên hiển thị chi tiết của Gợi ý được chọn
  if (selectedSuggestionId) {
    return (
      <SuggestionDetails 
        suggestionId={selectedSuggestionId} 
        matchSuggestions={matchSuggestions}
        importContainers={importContainers}
        exportBookings={exportBookings}
      />
    )
  }

  // Nếu có lệnh được chọn, hiển thị thông tin chi tiết với timeline và actions
  if (selectedDropOffOrderId) {
    const container = importContainers.find(c => c.id === selectedDropOffOrderId)
    if (!container) return <DefaultSidebarState />

    // Sử dụng StatusTimeline thông minh - không cần tạo steps thủ công nữa

    const suggestedActions = [
      {
        id: 'find-reuse',
        title: 'Tìm cơ hội Re-use',
        description: 'Tìm kiếm booking phù hợp để ghép nối với container này',
        variant: 'default' as const,
        icon: ArrowRightLeft,
        onClick: () => console.log('Find reuse opportunities'),
        priority: 'high' as const
      },
      {
        id: 'request-cod',
        title: 'Yêu cầu Đổi Nơi Trả (COD)',
        description: 'Yêu cầu thay đổi địa điểm giao trả container',
        variant: 'outline' as const,
        icon: MapPin,
        onClick: () => console.log('Request COD'),
        priority: 'medium' as const
      }
    ]

    return (
      <div className="h-[100vh] sticky top-[64px] overflow-y-auto">
        <Card className="h-full p-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Container className="w-4 h-4 text-white" />
              </div>
              Chi tiết Lệnh
            </CardTitle>
            <p className="text-xl font-bold text-text-primary">{container.container_number}</p>
          </CardHeader>

          <CardContent className="space-y-6 overflow-y-auto h-[calc(100%-100px)]">
            

            {/* Status Timeline */}
            <StatusTimeline 
              containerStatus={container.status}
              containerType={container.container_type || 'IMPORT'}
              containerData={container}
            />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (selectedPickupOrderId) {
    const booking = exportBookings.find(b => b.id === selectedPickupOrderId)
    if (!booking) return <DefaultSidebarState />

    const timelineSteps = [
      {
        id: 'created',
        title: 'Booking đã được tạo',
        description: 'Yêu cầu lấy container đã được đăng ký',
        status: 'completed' as const,
        timestamp: new Date(booking.created_at).toLocaleDateString('vi-VN')
      },
      {
        id: 'available',
        title: 'Đang tìm container',
        description: 'Hệ thống đang tìm container phù hợp',
        status: booking.status === 'AVAILABLE' ? 'current' as const : 'pending' as const
      },
      {
        id: 'matched',
        title: 'Đã ghép nối',
        description: 'Đã tìm thấy container phù hợp',
        status: 'pending' as const
      },
      {
        id: 'completed',
        title: 'Hoàn tất',
        description: 'Quá trình lấy container đã hoàn tất',
        status: 'pending' as const
      }
    ]

    const suggestedActions = [
      {
        id: 'find-container',
        title: 'Tìm Container Phù Hợp',
        description: 'Tìm kiếm container sẵn có phù hợp với booking này',
        variant: 'default' as const,
        icon: Container,
        onClick: () => console.log('Find suitable container'),
        priority: 'high' as const
      },
      {
        id: 'extend-deadline',
        title: 'Gia Hạn Thời Hạn',
        description: 'Yêu cầu gia hạn thời gian cần container',
        variant: 'outline' as const,
        icon: Clock,
        onClick: () => console.log('Extend deadline'),
        priority: 'medium' as const
      }
    ]

    return (
      <div className="h-full overflow-hidden">
        <Card className="h-full p-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-white" />
              </div>
              Chi tiết Booking
            </CardTitle>
            <p className="text-sm text-text-secondary">
              {booking.booking_number}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 overflow-y-auto h-[calc(100%-100px)]">
            {/* Booking Info */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-text-primary">
                    {booking.booking_number}
                  </div>
                  <div className="text-sm text-orange-700">
                    {booking.required_container_type}
                  </div>
                </div>
                <div className="text-sm text-orange-700">
                  <p>Lấy tại: {booking.pick_up_location || 'Chưa xác định'}</p>
                  <p>Trạng thái: {booking.status}</p>
                  <p>Cần trước: {
                    booking.needed_by_datetime 
                      ? new Date(booking.needed_by_datetime).toLocaleString('vi-VN')
                      : 'Linh hoạt'
                  }</p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <StatusTimeline 
              steps={timelineSteps} 
              currentStep={booking.status}
              containerStatus={booking.status}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Trạng thái mặc định khi không có gì được chọn
  return <DefaultSidebarState />
}