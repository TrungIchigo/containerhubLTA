import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, RotateCcw, TrendingUp, MessageSquare, MapPin } from 'lucide-react'
import Link from 'next/link'

interface CarrierKPICardsProps {
  kpis: {
    pendingCount: number
    approvedThisMonth: number
    totalApproved: number
  }
}

interface CarrierKPICardsInlineProps {
  pendingCodRequests: number
  pendingStreetTurnRequests: number
  approvedButUnpaidCodRequests: number
}

export function CarrierKPICardsInline({ 
  pendingCodRequests, 
  pendingStreetTurnRequests, 
  approvedButUnpaidCodRequests 
}: CarrierKPICardsInlineProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Yêu cầu COD */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-blue-100 text-xs font-medium uppercase tracking-wide">Yêu cầu Thay Đổi Địa Điểm</div>
            <div className="text-2xl font-bold">{pendingCodRequests}</div>
          </div>
        </div>
      </div>

      {/* Yêu cầu Re-use */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-orange-100 text-xs font-medium uppercase tracking-wide">Yêu cầu Re-use</div>
            <div className="text-2xl font-bold">{pendingStreetTurnRequests}</div>
          </div>
        </div>
      </div>

      {/* Thay đổi địa điểm đã duyệt chưa thanh toán */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Thay đổi địa điểm đã duyệt</div>
            <div className="text-2xl font-bold">{approvedButUnpaidCodRequests}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CarrierKPICards({ kpis }: CarrierKPICardsProps) {
  const kpiData = [
    {
      title: 'Yêu Cầu Chờ Duyệt',
      value: kpis.pendingCount,
      icon: Clock,
      iconColor: 'text-text-primary',
      bgGradient: 'bg-gradient-to-br from-yellow-50 to-yellow-200',
      href: '/carrier-admin?tab=street-turn',
      isUrgent: kpis.pendingCount > 0
    },
    {
      title: 'Đã Duyệt Tháng Này',
      value: kpis.approvedThisMonth,
      icon: CheckCircle,
      iconColor: 'text-text-primary',
      bgGradient: 'bg-gradient-to-br from-green-50 to-green-200',
      href: '/carrier-admin/requests?status=approved',
      isUrgent: false
    },
    {
      title: 'Tổng Lượt Re-use',
      value: kpis.totalApproved,
      icon: RotateCcw,
      iconColor: 'text-text-primary',
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-200',
      href: '/dashboard',
      isUrgent: false
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {kpiData.map((kpi) => {
        const IconComponent = kpi.icon
        return (
          <Link key={kpi.title} href={kpi.href} className="block group">
            <Card className={`border cursor-pointer transition-all duration-200 hover:shadow-md ${kpi.bgGradient} ${kpi.isUrgent ? 'ring-2 ring-orange-300/50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-text-primary mb-1">
                      {kpi.title}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-text-primary">
                        {kpi.value.toLocaleString()}
                      </p>
                      {kpi.value > 0 && kpi.title !== 'Yêu Cầu Chờ Duyệt' && (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    {kpi.isUrgent && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-orange-600 font-medium">Cần xử lý</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <IconComponent className={`w-6 h-6 ${kpi.iconColor}`} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <span className="text-xs text-text-primary group-hover:text-blue-600 transition-colors">
                    {kpi.isUrgent ? 'Xử lý ngay →' : 'Xem chi tiết →'}
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