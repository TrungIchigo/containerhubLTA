import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Container, FileText, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface KPICardsProps {
  availableContainers: number
  availableBookings: number
  approvedStreetTurns: number
}

export default function KPICards({ 
  availableContainers, 
  availableBookings, 
  approvedStreetTurns 
}: KPICardsProps) {
  const cards = [
    {
      title: 'Container Sẵn Sàng',
      value: availableContainers,
      icon: Container,
      bgGradient: 'bg-gradient-to-br from-white to-primary/5',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      borderColor: 'border-l-4 border-l-primary',
      href: '/dispatcher#import-containers',
      description: 'containers sẵn sàng tái sử dụng'
    },
    {
      title: 'Booking Đang Chờ',
      value: availableBookings,
      icon: FileText,
      bgGradient: 'bg-gradient-to-br from-warning/10 to-warning/20',
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning-foreground',
      borderColor: 'border-l-4 border-l-warning',
      href: '/dispatcher#export-bookings',
      description: 'bookings cần container rỗng'
    },
    {
      title: 'Tái Sử Dụng Đã Duyệt',
      value: approvedStreetTurns,
      icon: CheckCircle,
      bgGradient: 'bg-gradient-to-br from-white to-primary/5',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      borderColor: 'border-l-4 border-l-primary',
      href: '/dispatcher/requests',
      description: 'yêu cầu đã được phê duyệt'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Link key={index} href={card.href} className="block group">
            <Card className={`
              kpi-card 
              ${card.bgGradient} 
              ${card.borderColor}
              border-0 
              cursor-pointer 
              transition-all 
              duration-200 
              hover:shadow-lg 
              hover:scale-[1.02]
              hover:-translate-y-1
            `}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-text-secondary">
                    {card.title}
                  </CardTitle>
                </div>
                {/* Large decorative icon */}
                <div className={`
                  w-16 h-16 
                  ${card.iconBg} 
                  rounded-lg 
                  flex items-center justify-center
                  opacity-20
                  group-hover:opacity-30
                  transition-opacity
                `}>
                  <Icon className={`w-8 h-8 ${card.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Large metric value */}
                <div className="text-4xl font-bold text-text-primary mb-2 group-hover:scale-105 transition-transform">
                  {card.value.toLocaleString()}
                </div>
                {/* Description */}
                <p className="text-sm text-text-secondary">
                  {card.description}
                </p>
                {/* Small icon indicator */}
                <div className="flex items-center justify-between mt-3">
                  <div className={`p-1.5 rounded ${card.iconBg}`}>
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                  <span className="text-xs text-text-secondary group-hover:text-primary transition-colors">
                    Xem chi tiết →
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
} 