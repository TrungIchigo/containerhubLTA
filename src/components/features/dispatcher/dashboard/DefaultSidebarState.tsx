'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, Clock, Star, Target, Activity, CheckCircle } from 'lucide-react'
import { useIsClient } from '@/hooks/use-hydration'

export function DefaultSidebarState() {
  const isClient = useIsClient()
  
  const tips = [
    {
      icon: Target,
      title: 'Tối ưu điểm số',
      description: 'Điền đầy đủ thông tin container và booking để tăng hiệu quả ghép nối',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      icon: Clock,
      title: 'Thời gian quan trọng',
      description: 'Container và booking có thời gian khớp sẽ được ưu tiên cao hơn',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    {
      icon: Star,
      title: 'Chất lượng container',
      description: 'Container chất lượng tốt sẽ có nhiều cơ hội ghép nối hơn',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    }
  ]

  const quickStats = [
    { 
      label: 'Điểm trung bình', 
      value: '78', 
      color: 'text-green-600',
      icon: TrendingUp,
      bg: 'bg-green-50'
    },
    { 
      label: 'Cơ hội hôm nay', 
      value: '12', 
      color: 'text-blue-600',
      icon: Activity,
      bg: 'bg-blue-50'
    },
    { 
      label: 'Tiết kiệm ước tính', 
      value: '2.4M', 
      color: 'text-purple-600',
      icon: CheckCircle,
      bg: 'bg-purple-50'
    }
  ]

  return (
    <div className="h-full overflow-hidden">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            Thông tin Chi tiết
          </CardTitle>
          <p className="text-sm text-text-secondary">
            Chọn container hoặc booking để xem chi tiết
          </p>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto h-[calc(100%-100px)]">

          {/* Quick Stats */}
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Thống kê nhanh
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className={`flex items-center justify-between p-3 ${stat.bg} rounded-lg border`}>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-sm text-text-secondary">{stat.label}</span>
                    </div>
                    <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tips Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Mẹo tối ưu hóa
            </h4>
            
            {tips.map((tip, index) => (
              <Card key={index} className={`${tip.bg} ${tip.border} border-l-4`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <tip.icon className={`w-5 h-5 mt-0.5 ${tip.color}`} />
                    <div className="flex-1">
                      <h5 className="font-medium text-sm text-text-primary mb-1">
                        {tip.title}
                      </h5>
                      <p className="text-xs text-text-secondary">
                        {tip.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Guide */}
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary">Hướng dẫn sử dụng</h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-text-secondary">
                  <strong className="text-blue-700">Tab Gợi ý:</strong> Xem các cơ hội ghép nối tốt nhất được sắp xếp theo hiệu quả
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-text-secondary">
                  <strong className="text-green-700">Click container:</strong> Để xem các lệnh lấy rỗng phù hợp
                </span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-text-secondary">
                  <strong className="text-orange-700">Click booking:</strong> Để xem container sẵn có phù hợp
                </span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary">Trạng thái hệ thống</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm p-2 bg-green-50 rounded-lg">
                <span className="text-text-secondary flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Thuật toán ghép nối
                </span>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Hoạt động
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm p-2 bg-green-50 rounded-lg">
                <span className="text-text-secondary flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Dữ liệu real-time
                </span>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Cập nhật
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                <span className="text-text-secondary">Cập nhật cuối</span>
                <span className="text-xs text-text-secondary" suppressHydrationWarning>
                  {isClient ? new Date().toLocaleTimeString('vi-VN') : '--:--:--'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 