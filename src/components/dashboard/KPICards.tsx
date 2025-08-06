import { Leaf, TrendingUp, CheckCircle, BarChart3 } from 'lucide-react'

interface DashboardKPIs {
  total_cost_saving: number
  total_co2_saving: number
  successful_street_turns: number
  approval_rate: number
}

interface KPICardsProps {
  kpis: DashboardKPIs
  className?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('vi-VN').format(num)
}

export default function KPICards({ kpis, className }: KPICardsProps) {
  const kpiData = [
    {
      title: 'Tổng Chi Phí Tiết Kiệm',
      value: formatCurrency(kpis.total_cost_saving),
      description: 'ước tính dựa trên các chuyến đi đã loại bỏ',
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary-light'
    },
    {
      title: 'Tổng Lượng CO2 Giảm Thải',
      value: `${formatNumber(kpis.total_co2_saving)} kg`,
      description: 'đóng góp vào môi trường xanh',
      icon: Leaf,
      color: 'text-primary',
      bgColor: 'bg-primary-light'
    },
    {
      title: 'Tổng Số Re-use Thành Công',
      value: formatNumber(kpis.successful_street_turns),
      description: 'yêu cầu đã được phê duyệt',
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary-light'
    },
    {
      title: 'Tỷ Lệ Phê Duyệt',
      value: `${kpis.approval_rate}%`,
      description: 'hiệu quả trong việc kết nối',
      icon: BarChart3,
      color: 'text-accent',
      bgColor: 'bg-accent-light'
    }
  ]

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {kpiData.map((kpi, index) => {
        const IconComponent = kpi.icon
        return (
          <div key={index} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <IconComponent className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="kpi-value">
                {kpi.value}
              </div>
              <h3 className="text-body font-medium text-text-primary leading-tight">
                {kpi.title}
              </h3>
              <p className="kpi-label">
                {kpi.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}