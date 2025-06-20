import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, ArrowRight, Truck, Container } from 'lucide-react'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ImportContainer, ExportBooking, Organization } from '@/lib/types'

interface DropoffOrderCardProps {
  container: ImportContainer & { shipping_line?: Organization }
}

export function DropoffOrderCard({ container }: DropoffOrderCardProps) {
  const statusMap = {
    'AVAILABLE': { text: 'Sẵn sàng', variant: 'approved' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'AWAITING_APPROVAL': { text: 'Chờ duyệt', variant: 'pending' as const, bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'AWAITING_COD_APPROVAL': { text: 'Chờ duyệt COD', variant: 'pending' as const, bg: 'bg-orange-50', border: 'border-orange-200' },
    'CONFIRMED': { text: 'Đã ghép', variant: 'info' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
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

  return (
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
              <div className="text-xs text-gray-500">Sẵn sàng lúc</div>
              <div className="font-medium">{formatStoredDateTimeVN(container.available_from_datetime)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PickupOrderCardProps {
  booking: ExportBooking & { shipping_line?: Organization }
}

export function PickupOrderCard({ booking }: PickupOrderCardProps) {
  const statusMap = {
    'AVAILABLE': { text: 'Sẵn sàng', variant: 'approved' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'AWAITING_APPROVAL': { text: 'Chờ duyệt', variant: 'pending' as const, bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'CONFIRMED': { text: 'Đã ghép', variant: 'info' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
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
                <Badge variant="destructive" className="text-xs animate-pulse">Gấp!</Badge>
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
        </div>
      </CardContent>
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
}

export function ReuseCard({ suggestion }: ReuseCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm text-gray-600 font-medium">Gợi ý ghép nối</div>
              <div className="text-text-primary font-semibold">Tái sử dụng container</div>
            </div>
          </div>
          
          {/* Lệnh Giao Trả */}
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
        </div>
      </CardContent>
    </Card>
  )
} 