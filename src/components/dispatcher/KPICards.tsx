import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Container, FileText, CheckCircle } from 'lucide-react'

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
      bgColor: 'bg-primary-light',
      iconColor: 'text-primary',
      textColor: 'text-primary',
      valueColor: 'text-text-primary'
    },
    {
      title: 'Booking Đang Chờ',
      value: availableBookings,
      icon: FileText,
      bgColor: 'bg-accent-light',
      iconColor: 'text-accent',
      textColor: 'text-accent-foreground',
      valueColor: 'text-text-primary'
    },
    {
      title: 'Tái Sử Dụng Đã Duyệt',
      value: approvedStreetTurns,
      icon: CheckCircle,
      bgColor: 'bg-primary-light',
      iconColor: 'text-primary',
      textColor: 'text-primary',
      valueColor: 'text-text-primary'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className={`kpi-card ${card.bgColor} border-0`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className={`kpi-label ${card.textColor}`}>
                {card.title}
              </CardTitle>
              <Icon className={`h-6 w-6 ${card.iconColor}`} />
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`kpi-value ${card.valueColor}`}>
                {card.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 