'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'

interface AdminStats {
  pending_count: number
  active_count: number
  rejected_count: number
  total_count: number
  today_registrations: number
}

interface AdminStatsCardsProps {
  stats: AdminStats
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const statCards = [
    {
      title: 'Chờ phê duyệt',
      value: stats.pending_count,
      icon: Clock,
      description: 'Tổ chức chờ duyệt',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Đang hoạt động',
      value: stats.active_count,
      icon: CheckCircle,
      description: 'Tổ chức đã duyệt',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Đã từ chối',
      value: stats.rejected_count,
      icon: XCircle,
      description: 'Tổ chức bị từ chối',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Đăng ký hôm nay',
      value: stats.today_registrations,
      icon: TrendingUp,
      description: 'Đăng ký trong ngày',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className={`${card.bgColor} ${card.borderColor} border-2`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {card.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${card.color}`}>
                {card.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 