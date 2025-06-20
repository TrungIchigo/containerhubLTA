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
      iconColor: 'text-text-primary',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-300',
      href: '/dispatcher/containers'
    },
    {
      title: 'Booking Đang Chờ',
      value: availableBookings,
      icon: FileText,
      iconColor: 'text-text-primary',
      bgGradient: 'bg-gradient-to-br from-yellow-50 to-yellow-200',
      href: '/dispatcher/bookings'
    },
    {
      title: 'Tái Sử Dụng Đã Duyệt',
      value: approvedStreetTurns,
      icon: CheckCircle,
      iconColor: 'text-text-primary',
      bgGradient: 'bg-gradient-to-br from-white to-primary/50',
      href: '/dispatcher/street-turns'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Link key={index} href={card.href} className="block group">
            <Card className={`border cursor-pointer transition-all duration-200 hover:shadow-md ${card.bgGradient}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-text-primary mb-1">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <span className="text-xs text-text-primary group-hover:text-primary transition-colors">
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