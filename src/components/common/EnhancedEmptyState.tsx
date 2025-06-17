import { 
  Container, 
  Truck, 
  RefreshCw, 
  Clock, 
  Package, 
  Search 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface EnhancedEmptyStateProps {
  type: 'import-containers' | 'export-bookings' | 'street-turn-requests' | 'pending-requests' | 'approved-requests' | 'general'
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export default function EnhancedEmptyState({
  type,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = ''
}: EnhancedEmptyStateProps) {
  // Định nghĩa các configs cho từng type
  const configs = {
    'import-containers': {
      icon: Container,
      defaultTitle: 'Chưa có Lệnh Giao Trả nào',
      defaultDescription: 'Hãy bắt đầu bằng cách thêm lệnh giao trả đầu tiên của bạn để hệ thống có thể tìm kiếm cơ hội tối ưu hóa.',
      defaultActionLabel: '+ Thêm Lệnh Giao Trả',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10'
    },
    'export-bookings': {
      icon: Truck,
      defaultTitle: 'Chưa có Lệnh Lấy Rỗng nào',
      defaultDescription: 'Thêm lệnh lấy rỗng để hệ thống có thể ghép nối với các container sẵn sàng và tối ưu hóa chi phí vận chuyển.',
      defaultActionLabel: '+ Thêm Lệnh Lấy Rỗng',
      iconColor: 'text-accent',
      iconBg: 'bg-accent/10'
    },
    'street-turn-requests': {
      icon: RefreshCw,
      defaultTitle: 'Chưa có Yêu cầu Tái sử dụng nào',
      defaultDescription: 'Khi có lệnh giao trả và lệnh lấy rỗng phù hợp, hệ thống sẽ tự động tạo gợi ý tái sử dụng container.',
      defaultActionLabel: 'Tìm kiếm Cơ hội',
      iconColor: 'text-info',
      iconBg: 'bg-info/10'
    },
    'pending-requests': {
      icon: Clock,
      defaultTitle: 'Không có Yêu cầu Chờ duyệt',
      defaultDescription: 'Tất cả yêu cầu tái sử dụng container đã được xử lý. Bạn sẽ nhận được thông báo khi có yêu cầu mới.',
      defaultActionLabel: 'Xem Tất cả Yêu cầu',
      iconColor: 'text-warning',
      iconBg: 'bg-warning/10'
    },
    'approved-requests': {
      icon: Package,
      defaultTitle: 'Chưa có Yêu cầu nào được Duyệt',
      defaultDescription: 'Danh sách các yêu cầu đã phê duyệt sẽ hiển thị tại đây để bạn theo dõi và quản lý.',
      defaultActionLabel: 'Xem Lịch sử',
      iconColor: 'text-success',
      iconBg: 'bg-success/10'
    },
    'general': {
      icon: Search,
      defaultTitle: 'Không có dữ liệu',
      defaultDescription: 'Hiện tại chưa có thông tin để hiển thị.',
      defaultActionLabel: 'Làm mới',
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-100'
    }
  }

  const config = configs[type] || configs.general
  const IconComponent = config.icon

  const finalTitle = title || config.defaultTitle
  const finalDescription = description || config.defaultDescription
  const finalActionLabel = actionLabel || config.defaultActionLabel

  const buttonElement = (actionHref || onAction) ? (
    actionHref ? (
      <Link href={actionHref}>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          {finalActionLabel}
        </Button>
      </Link>
    ) : (
      <Button 
        onClick={onAction}
        className="bg-primary hover:bg-primary/90 text-white"
      >
        {finalActionLabel}
      </Button>
    )
  ) : null

  return (
    <Card className={`${className}`}>
      <CardContent className="relative">
        {/* Button positioned at top right */}
        {buttonElement && (
          <div className="absolute top-4 right-4 z-10">
            {buttonElement}
          </div>
        )}
        
        {/* Main content */}
        <div className="text-center py-12 pr-16">
          {/* Icon */}
          <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${config.iconBg}`}>
            <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          
          {/* Title */}
          <h3 className="text-h3 text-text-primary mb-3 font-semibold">
            {finalTitle}
          </h3>
          
          {/* Description */}
          <p className="text-body text-text-secondary max-w-md mx-auto leading-relaxed">
            {finalDescription}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 