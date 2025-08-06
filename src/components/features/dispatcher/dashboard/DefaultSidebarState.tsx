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
      <Card className="h-full p-4">
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
        </CardContent>
      </Card>
    </div>
  )
} 