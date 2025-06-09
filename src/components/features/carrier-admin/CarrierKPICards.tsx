import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, RotateCcw } from 'lucide-react'

interface CarrierKPICardsProps {
  kpis: {
    pendingCount: number
    approvedThisMonth: number
    totalApproved: number
  }
}

export default function CarrierKPICards({ kpis }: CarrierKPICardsProps) {
  const kpiData = [
    {
      title: 'Yêu Cầu Chờ Duyệt',
      value: kpis.pendingCount,
      icon: Clock,
      bgColor: 'bg-accent-light',
      iconColor: 'text-accent',
      description: 'yêu cầu đang chờ xử lý'
    },
    {
      title: 'Đã Duyệt Tháng Này',
      value: kpis.approvedThisMonth,
      icon: CheckCircle,
      bgColor: 'bg-primary-light',
      iconColor: 'text-primary',
      description: 'yêu cầu đã phê duyệt'
    },
    {
      title: 'Tổng Lượt Tái Sử Dụng',
      value: kpis.totalApproved,
      icon: RotateCcw,
      bgColor: 'bg-foreground',
      iconColor: 'text-info',
      description: 'lượt street-turn thành công'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {kpiData.map((kpi) => {
        const IconComponent = kpi.icon
        return (
          <Card key={kpi.title} className="kpi-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="kpi-label text-text-secondary">
                {kpi.title}
              </CardTitle>
              <div className={`w-12 h-12 rounded-full ${kpi.bgColor} flex items-center justify-center border border-border`}>
                <IconComponent className={`w-6 h-6 ${kpi.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="kpi-value text-text-primary mb-2">
                {kpi.value.toLocaleString()}
              </div>
              <p className="text-body-small text-text-secondary">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 