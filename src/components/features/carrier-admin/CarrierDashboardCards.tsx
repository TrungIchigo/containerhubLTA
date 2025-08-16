import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, RotateCcw, MessageSquare, DollarSign, CheckCircle2 } from 'lucide-react'
import { formatStoredDateTimeVN } from '@/lib/utils'

// Mock types - sẽ cần cập nhật từ types thực tế
interface CodRequest {
  id: string
  container_number: string
  booking_number: string
  original_location: string
  requested_location: string
  reason: string
  status: string
  created_at: string
  requested_by_org?: { name: string }
  fee_amount?: number
}

interface StreetTurnRequest {
  id: string
  container_number: string
  pickup_company_name: string
  pickup_location: string
  dropoff_location: string
  status: string
  created_at: string
  needed_by_datetime: string
  cost_saving?: number
  co2_saving?: number
}

interface CodRequestCardProps {
  request: CodRequest
}

export function CodRequestCard({ request }: CodRequestCardProps) {
  const statusMap = {
    'PENDING': { text: 'Chờ duyệt COD', variant: 'pending-cod' as const, bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'APPROVED': { text: 'Đang thực hiện COD', variant: 'processing-cod' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'DECLINED': { text: 'Bị từ chối COD', variant: 'declined-cod' as const, bg: 'bg-red-50', border: 'border-red-200' },
    'PENDING_PAYMENT': { text: 'Chờ thanh toán phí COD', variant: 'pending-cod-payment' as const, bg: 'bg-orange-50', border: 'border-orange-200' },
    'PAID': { text: 'Đã thanh toán COD', variant: 'completed' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
    'PROCESSING_AT_DEPOT': { text: 'Đang xử lý tại Depot', variant: 'processing-depot' as const, bg: 'bg-blue-50', border: 'border-blue-200' },
    'COMPLETED': { text: 'Hoàn tất', variant: 'completed' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'EXPIRED': { text: 'Hết hạn', variant: 'declined-cod' as const, bg: 'bg-gray-50', border: 'border-gray-200' },
    'REVERSED': { text: 'Đã hủy', variant: 'declined-cod' as const, bg: 'bg-red-50', border: 'border-red-200' },
    'AWAITING_INFO': { text: 'Chờ bổ sung thông tin', variant: 'warning' as const, bg: 'bg-purple-50', border: 'border-purple-200' },
  }

  const getStatusInfo = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      variant: 'outline' as const, 
      bg: 'bg-gray-50', 
      border: 'border-gray-200' 
    }
  }

  const statusInfo = getStatusInfo(request.status)

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${statusInfo.bg} ${statusInfo.border} border-2`}>
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header with COD Icon */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-text-primary text-lg truncate">{request.container_number}</div>
              </div>
            </div>
            <Badge variant={statusInfo.variant} className="shadow-sm flex-shrink-0">{statusInfo.text}</Badge>
          </div>
          
          {/* Company Info */}
          <div className="rounded-lg p-3">
            <div className="text-sm text-gray-600 font-medium">Công ty yêu cầu</div>
            <div className="text-text-primary font-semibold">{request.requested_by_org?.name || 'N/A'}</div>
          </div>
          
          {/* Location Change */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Địa điểm ban đầu</div>
                <div className="font-medium">{request.original_location}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Địa điểm mới</div>
                <div className="font-medium">{request.requested_location}</div>
              </div>
            </div>
          </div>
          
          {/* Fee Amount */}
          {request.fee_amount && (
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Phí COD</div>
                <div className="font-medium text-yellow-600">{request.fee_amount?.toLocaleString('vi-VN')} VNĐ</div>
              </div>
            </div>
          )}
          
          {/* Time */}
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Yêu cầu lúc</div>
              <div className="font-medium">{formatStoredDateTimeVN(request.created_at)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StreetTurnRequestCardProps {
  request: StreetTurnRequest
}

export function StreetTurnRequestCard({ request }: StreetTurnRequestCardProps) {
  const statusMap = {
    'PENDING': { text: 'Chờ duyệt Re-use', variant: 'pending-reuse' as const, bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'APPROVED': { text: 'Đang thực hiện Re-use', variant: 'processing-reuse' as const, bg: 'bg-green-50', border: 'border-green-200' },
    'DECLINED': { text: 'Bị từ chối Re-use', variant: 'declined-reuse' as const, bg: 'bg-red-50', border: 'border-red-200' },
    'REJECTED': { text: 'Bị từ chối Re-use', variant: 'declined-reuse' as const, bg: 'bg-red-50', border: 'border-red-200' },
  }

  const getStatusInfo = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      variant: 'outline' as const, 
      bg: 'bg-gray-50', 
      border: 'border-gray-200' 
    }
  }

  const statusInfo = getStatusInfo(request.status)

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${statusInfo.bg} ${statusInfo.border} border-2`}>
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header with StreetTurn Icon */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-text-primary text-lg truncate">{request.container_number}</div>
              </div>
            </div>
            <Badge variant={statusInfo.variant} className="shadow-sm flex-shrink-0">{statusInfo.text}</Badge>
          </div>
          
          {/* Company Info */}
          <div className="rounded-lg p-3">
            <div className="text-sm text-gray-600 font-medium">Công ty vận tải</div>
            <div className="text-text-primary font-semibold">{request.pickup_company_name}</div>
          </div>
          
          {/* Locations */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Lấy tại</div>
                <div className="font-medium">{request.pickup_location}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Trả tại</div>
                <div className="font-medium">{request.dropoff_location}</div>
              </div>
            </div>
          </div>
          
          {/* Benefits */}
          {(request.cost_saving || request.co2_saving) && (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <div className="text-sm font-medium text-emerald-700 mb-2">Lợi ích dự kiến</div>
              <div className="grid grid-cols-2 gap-2">
                {request.cost_saving && (
                  <div className="text-center">
                    <div className="text-xs text-emerald-600">Tiết kiệm</div>
                    <div className="text-emerald-700 font-bold">{request.cost_saving.toLocaleString('vi-VN')} VNĐ</div>
                  </div>
                )}
                {request.co2_saving && (
                  <div className="text-center">
                    <div className="text-xs text-emerald-600">CO₂</div>
                    <div className="text-emerald-700 font-bold">{request.co2_saving}kg</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Time */}
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Cần trước</div>
              <div className="font-medium">{formatStoredDateTimeVN(request.needed_by_datetime)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ApprovedCodRequestCardProps {
  request: CodRequest
}

export function ApprovedCodRequestCard({ request }: ApprovedCodRequestCardProps) {
  const statusMap = {
    'APPROVED': { text: 'Đang thực hiện COD', variant: 'processing-cod' as const },
    'PENDING_PAYMENT': { text: 'Chờ thanh toán COD', variant: 'pending-cod-payment' as const },
    'PAID': { text: 'Đã thanh toán COD', variant: 'completed' as const },
    'PROCESSING_AT_DEPOT': { text: 'Đang xử lý tại Depot', variant: 'processing-depot' as const },
    'COMPLETED': { text: 'Hoàn tất COD', variant: 'completed' as const },
  }

  const getStatusInfo = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      variant: 'outline' as const 
    }
  }

  const statusInfo = getStatusInfo(request.status)
  
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-text-primary text-lg truncate">{request.container_number}</div>
              </div>
            </div>
            <Badge variant={statusInfo.variant} className="shadow-sm flex-shrink-0">{statusInfo.text}</Badge>
          </div>
          
          {/* Company Info */}
          <div className="rounded-lg p-3">
            <div className="text-sm text-gray-600 font-medium">Công ty</div>
            <div className="text-text-primary font-semibold">{request.requested_by_org?.name || 'N/A'}</div>
          </div>
          
          {/* Fee Amount */}
          {request.fee_amount && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-yellow-700">Số tiền cần thanh toán</div>
                <div className="text-xl font-bold text-yellow-700">{request.fee_amount.toLocaleString('vi-VN')} VNĐ</div>
              </div>
            </div>
          )}
          
          {/* Location */}
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Địa điểm mới</div>
              <div className="font-medium">{request.requested_location}</div>
            </div>
          </div>
          
          {/* Time */}
          <div className="flex items-center gap-3 text-text-secondary">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Duyệt lúc</div>
              <div className="font-medium">{formatStoredDateTimeVN(request.created_at)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}