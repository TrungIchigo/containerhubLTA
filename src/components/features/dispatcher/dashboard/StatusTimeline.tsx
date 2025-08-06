'use client'

import { CheckCircle, Clock, AlertCircle, Circle, Container, FileText, CreditCard, Truck, MapPin, Package, ArrowRightLeft } from 'lucide-react'

interface TimelineStep {
  id: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending' | 'skipped'
  timestamp?: string
  icon?: React.ComponentType<any>
  actionRequired?: boolean
  nextAction?: string
}

interface StatusTimelineProps {
  containerStatus: string
  containerType?: string
  containerData?: {
    created_at?: string
    available_from_datetime?: string
    container_number?: string
    [key: string]: any
  }
  // Backward compatibility
  steps?: TimelineStep[]
  currentStep?: string
}

/**
 * Tạo timeline steps thông minh dựa trên container status
 */
function generateSmartTimeline(status: string, containerType?: string, containerData?: any): TimelineStep[] {
  const baseSteps: TimelineStep[] = [
    {
      id: 'created',
      title: 'Lệnh được tạo',
      description: 'Container đã được đăng ký vào hệ thống',
      status: 'completed',
      icon: Container,
      timestamp: containerData?.created_at ? new Date(containerData.created_at).toLocaleDateString('vi-VN') : undefined
    },
    {
      id: 'available',
      title: 'Sẵn sàng xử lý',
      description: 'Container đã sẵn sàng để tìm cơ hội ghép nối',
      status: status === 'AVAILABLE' ? 'current' : (isStatusAfter(status, 'AVAILABLE') ? 'completed' : 'pending'),
      icon: Package,
      timestamp: containerData?.available_from_datetime ? new Date(containerData.available_from_datetime).toLocaleDateString('vi-VN') : undefined,
      actionRequired: status === 'AVAILABLE',
      nextAction: status === 'AVAILABLE' ? 'Tìm cơ hội Re-use hoặc COD' : undefined
    }
  ]

  // Thêm các bước dựa trên trạng thái hiện tại
  switch (status) {
    case 'AWAITING_REUSE_APPROVAL':
      baseSteps.push({
        id: 'reuse_requested',
        title: 'Yêu cầu Re-use',
        description: 'Đã tạo yêu cầu ghép nối với booking xuất khẩu',
        status: 'current',
        icon: ArrowRightLeft,
        actionRequired: true,
        nextAction: 'Chờ Carrier Admin phê duyệt'
      })
      break

    case 'AWAITING_COD_APPROVAL':
      baseSteps.push({
        id: 'cod_requested',
        title: 'Yêu cầu COD',
        description: 'Đã tạo yêu cầu đổi nơi trả container',
        status: 'current',
        icon: MapPin,
        actionRequired: true,
        nextAction: 'Chờ Carrier Admin phê duyệt'
      })
      break

    case 'AWAITING_COD_PAYMENT':
      baseSteps.push(
        {
          id: 'cod_approved',
          title: 'COD đã được duyệt',
          description: 'Carrier Admin đã phê duyệt yêu cầu COD',
          status: 'completed',
          icon: CheckCircle
        },
        {
          id: 'payment_pending',
          title: 'Chờ thanh toán phí',
          description: 'Cần thanh toán phí COD để tiếp tục',
          status: 'current',
          icon: CreditCard,
          actionRequired: true,
          nextAction: 'Thực hiện thanh toán phí COD'
        }
      )
      break

    case 'AWAITING_REUSE_PAYMENT':
      baseSteps.push(
        {
          id: 'reuse_approved',
          title: 'Re-use đã được duyệt',
          description: 'Carrier Admin đã phê duyệt yêu cầu Re-use',
          status: 'completed',
          icon: CheckCircle
        },
        {
          id: 'payment_pending',
          title: 'Chờ thanh toán phí',
          description: 'Cần thanh toán phí Re-use để tiếp tục',
          status: 'current',
          icon: CreditCard,
          actionRequired: true,
          nextAction: 'Thực hiện thanh toán phí Re-use'
        }
      )
      break

    case 'ON_GOING_COD':
      baseSteps.push(
        {
          id: 'cod_approved',
          title: 'COD đã được duyệt',
          description: 'Carrier Admin đã phê duyệt yêu cầu COD',
          status: 'completed',
          icon: CheckCircle
        },
        {
          id: 'payment_completed',
          title: 'Đã thanh toán',
          description: 'Phí COD đã được thanh toán thành công',
          status: 'completed',
          icon: CreditCard
        },
        {
          id: 'cod_processing',
          title: 'Đang thực hiện COD',
          description: 'Container đang được vận chuyển đến địa điểm mới',
          status: 'current',
          icon: Truck,
          actionRequired: true,
          nextAction: 'Theo dõi quá trình vận chuyển'
        }
      )
      break

    case 'ON_GOING_REUSE':
      baseSteps.push(
        {
          id: 'reuse_approved',
          title: 'Re-use đã được duyệt',
          description: 'Carrier Admin đã phê duyệt yêu cầu Re-use',
          status: 'completed',
          icon: CheckCircle
        },
        {
          id: 'payment_completed',
          title: 'Đã thanh toán',
          description: 'Phí Re-use đã được thanh toán thành công',
          status: 'completed',
          icon: CreditCard
        },
        {
          id: 'reuse_processing',
          title: 'Đang thực hiện Re-use',
          description: 'Container đang được sử dụng cho booking xuất khẩu',
          status: 'current',
          icon: Truck,
          actionRequired: true,
          nextAction: 'Theo dõi quá trình xuất khẩu'
        }
      )
      break

    case 'DEPOT_PROCESSING':
      const isFromCod = containerData?.previous_status === 'ON_GOING_COD'
      const isFromReuse = containerData?.previous_status === 'ON_GOING_REUSE'
      
      if (isFromCod) {
        baseSteps.push(
          {
            id: 'cod_completed',
            title: 'COD hoàn tất',
            description: 'Container đã được giao tại địa điểm mới',
            status: 'completed',
            icon: CheckCircle
          }
        )
      } else if (isFromReuse) {
        baseSteps.push(
          {
            id: 'reuse_completed',
            title: 'Re-use hoàn tất',
            description: 'Container đã hoàn tất quá trình xuất khẩu',
            status: 'completed',
            icon: CheckCircle
          }
        )
      }
      
      baseSteps.push({
        id: 'depot_processing',
        title: 'Xử lý tại Depot',
        description: 'Container đang được xử lý tại depot (vệ sinh, sửa chữa...)',
        status: 'current',
        icon: Package,
        actionRequired: true,
        nextAction: 'Xác nhận hoàn tất xử lý depot'
      })
      break

    case 'COMPLETED':
      baseSteps.push(
        {
          id: 'processing_completed',
          title: 'Xử lý hoàn tất',
          description: 'Tất cả các bước xử lý đã hoàn tất',
          status: 'completed',
          icon: CheckCircle
        },
        {
          id: 'ready_for_next',
          title: 'Sẵn sàng cho chu kỳ mới',
          description: 'Container có thể được sử dụng cho các yêu cầu mới',
          status: 'completed',
          icon: Package
        }
      )
      break

    case 'COD_REJECTED':
    case 'REUSE_REJECTED':
      const rejectionType = status === 'COD_REJECTED' ? 'COD' : 'Re-use'
      baseSteps.push({
        id: 'rejected',
        title: `${rejectionType} bị từ chối`,
        description: `Yêu cầu ${rejectionType} đã bị Carrier Admin từ chối`,
        status: 'current',
        icon: AlertCircle,
        actionRequired: true,
        nextAction: 'Tạo yêu cầu mới hoặc chỉnh sửa yêu cầu hiện tại'
      })
      break

    default:
      // Trạng thái không xác định, chỉ hiển thị bước cơ bản
      break
  }

  return baseSteps
}

/**
 * Kiểm tra xem status hiện tại có sau status so sánh không
 */
function isStatusAfter(currentStatus: string, compareStatus: string): boolean {
  const statusOrder = [
    'AVAILABLE',
    'AWAITING_REUSE_APPROVAL',
    'AWAITING_COD_APPROVAL', 
    'AWAITING_COD_PAYMENT',
    'AWAITING_REUSE_PAYMENT',
    'ON_GOING_COD',
    'ON_GOING_REUSE',
    'DEPOT_PROCESSING',
    'COMPLETED'
  ]
  
  const currentIndex = statusOrder.indexOf(currentStatus)
  const compareIndex = statusOrder.indexOf(compareStatus)
  
  return currentIndex > compareIndex && currentIndex !== -1 && compareIndex !== -1
}

export function StatusTimeline({ 
  containerStatus, 
  containerType, 
  containerData,
  steps: legacySteps, 
  currentStep: legacyCurrentStep 
}: StatusTimelineProps) {
  // Backward compatibility: nếu có steps cũ thì dùng
  const steps = legacySteps || generateSmartTimeline(containerStatus, containerType, containerData)
  const currentStep = legacyCurrentStep || containerStatus

  const getStepIcon = (step: TimelineStep) => {
    // Ưu tiên icon tùy chỉnh của step
    if (step.icon) {
      const IconComponent = step.icon
      const iconColor = step.status === 'completed' ? 'text-green-600' : 
                       step.status === 'current' ? 'text-blue-600' : 
                       step.status === 'skipped' ? 'text-gray-300' : 'text-gray-400'
      return <IconComponent className={`w-5 h-5 ${iconColor}`} />
    }

    // Fallback to default icons
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'current':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'skipped':
        return <Circle className="w-5 h-5 text-gray-300" />
      case 'pending':
        return <Circle className="w-5 h-5 text-gray-400" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStepStyle = (step: TimelineStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'current':
        return step.actionRequired 
          ? 'text-blue-700 bg-blue-50 border-blue-200 ring-2 ring-blue-100' 
          : 'text-blue-700 bg-blue-50 border-blue-200'
      case 'skipped':
        return 'text-gray-400 bg-gray-25 border-gray-100'
      case 'pending':
        return 'text-gray-500 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getBorderStyle = (step: TimelineStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-600'
      case 'current':
        return step.actionRequired ? 'border-blue-600 ring-2 ring-blue-200' : 'border-blue-600'
      case 'skipped':
        return 'border-gray-200'
      case 'pending':
        return 'border-gray-300'
      default:
        return 'border-gray-300'
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-text-primary flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Tiến Trình Xử Lý
      </h4>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Icon */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center bg-white border-2 ${getBorderStyle(step)}`}>
                {getStepIcon(step)}
              </div>
              
              {/* Content */}
              <div className={`flex-1 p-3 rounded-lg border ${getStepStyle(step)}`}>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-medium">{step.title}</h5>
                  {step.timestamp && (
                    <span className="text-xs opacity-75">{step.timestamp}</span>
                  )}
                </div>
                <p className="text-sm opacity-90">{step.description}</p>
                
                {/* Action Required Indicator */}
                {step.actionRequired && step.nextAction && (
                  <div className="mt-2 p-2 bg-blue-25 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Cần hành động:</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">{step.nextAction}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}