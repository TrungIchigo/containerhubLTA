import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, RotateCcw, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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
      bgGradient: 'bg-gradient-to-br from-warning/15 to-warning/25',
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning-foreground',
      borderColor: 'border-l-4 border-l-warning',
      href: '/carrier-admin?tab=street-turn',
      description: 'yêu cầu đang chờ xử lý',
      trend: kpis.pendingCount > 0 ? 'urgent' : 'normal'
    },
    {
      title: 'Đã Duyệt Tháng Này',
      value: kpis.approvedThisMonth,
      icon: CheckCircle,
      bgGradient: 'bg-gradient-to-br from-primary/10 to-primary/20',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      borderColor: 'border-l-4 border-l-primary',
      href: '/carrier-admin/requests?status=approved',
      description: 'yêu cầu đã phê duyệt',
      trend: 'positive'
    },
    {
      title: 'Tổng Lượt Tái Sử Dụng',
      value: kpis.totalApproved,
      icon: RotateCcw,
      bgGradient: 'bg-gradient-to-br from-success/10 to-success/20',
      iconBg: 'bg-success/20',
      iconColor: 'text-success',
      borderColor: 'border-l-4 border-l-success',
      href: '/dashboard',
      description: 'lượt tái sử dụng thành công',
      trend: 'growth'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {kpiData.map((kpi) => {
        const IconComponent = kpi.icon
        return (
          <Link key={kpi.title} href={kpi.href} className="block group">
            <Card className={`
              kpi-card 
              ${kpi.bgGradient} 
              ${kpi.borderColor}
              border-0 
              cursor-pointer 
              transition-all 
              duration-200 
              hover:shadow-lg 
              hover:scale-[1.02]
              hover:-translate-y-1
              ${kpi.trend === 'urgent' ? 'ring-2 ring-warning/20' : ''}
            `}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-text-secondary">
                    {kpi.title}
                  </CardTitle>
                  {/* Trend indicator */}
                  {kpi.trend === 'urgent' && kpi.value > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                      <span className="text-xs text-warning font-medium">Cần xử lý</span>
                    </div>
                  )}
                </div>
                {/* Large decorative icon */}
                <div className={`
                  w-16 h-16 
                  ${kpi.iconBg} 
                  rounded-lg 
                  flex items-center justify-center
                  opacity-20
                  group-hover:opacity-30
                  transition-opacity
                `}>
                  <IconComponent className={`w-8 h-8 ${kpi.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Large metric value */}
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-4xl font-bold text-text-primary group-hover:scale-105 transition-transform">
                    {kpi.value.toLocaleString()}
                  </div>
                  {/* Growth indicator for positive metrics */}
                  {(kpi.trend === 'positive' || kpi.trend === 'growth') && kpi.value > 0 && (
                    <TrendingUp className="w-5 h-5 text-success" />
                  )}
                </div>
                {/* Description */}
                <p className="text-sm text-text-secondary">
                  {kpi.description}
                </p>
                {/* Action indicator */}
                <div className="flex items-center justify-between mt-3">
                  <div className={`p-1.5 rounded ${kpi.iconBg}`}>
                    <IconComponent className={`w-4 h-4 ${kpi.iconColor}`} />
                  </div>
                  <span className="text-xs text-text-secondary group-hover:text-primary transition-colors">
                    {kpi.trend === 'urgent' && kpi.value > 0 ? 'Xử lý ngay →' : 'Xem chi tiết →'}
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