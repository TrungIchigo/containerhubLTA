'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Search, BarChart3, Settings, Truck, MapPin } from 'lucide-react'
import Link from 'next/link'

interface DynamicGreetingProps {
  userName?: string
  userRole?: 'DISPATCHER' | 'CARRIER_ADMIN' | string
  className?: string
}

export default function DynamicGreeting({ 
  userName = 'Bạn', 
  userRole = 'DISPATCHER',
  className = '' 
}: DynamicGreetingProps) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    let timeGreeting = ''
    
    if (hour >= 5 && hour < 12) {
      timeGreeting = 'Chào buổi sáng'
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = 'Chào buổi chiều'
    } else {
      timeGreeting = 'Chào buổi tối'
    }
    
    setGreeting(timeGreeting)
  }, [])

  const getQuickActions = () => {
    if (userRole === 'DISPATCHER') {
      return [
        {
          label: 'Thêm Lệnh Giao Trả',
          href: '/dispatcher?action=add-import',
          icon: Plus,
          variant: 'outline' as const
        },
        {
          label: 'Thêm Lệnh Lấy Rỗng',
          href: '/dispatcher?action=add-export',
          icon: Truck,
          variant: 'outline' as const
        },
        {
          label: 'Đi đến Thị trường',
          href: '/marketplace',
          icon: Search,
          variant: 'ghost' as const
        }
      ]
    } else if (userRole === 'CARRIER_ADMIN') {
      return [
        {
          label: 'Xem Quy tắc Tự động',
          href: '/carrier-admin/rules',
          icon: Settings,
          variant: 'outline' as const
        },
        {
          label: 'Báo cáo Nhanh',
          href: '/dashboard',
          icon: BarChart3,
          variant: 'outline' as const
        },
        {
          label: 'Quản lý COD',
          href: '/carrier-admin?tab=cod',
          icon: MapPin,
          variant: 'ghost' as const
        }
      ]
    }
    return []
  }

  const quickActions = getQuickActions()

  return (
    <Card className={`p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-border/50 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Greeting Section */}
        <div>
          <h2 className="text-h2 font-semibold text-text-primary mb-1">
            {greeting}, {userName}!
          </h2>
          <p className="text-body text-text-secondary">
            {userRole === 'DISPATCHER' 
              ? 'Hãy bắt đầu ngày làm việc hiệu quả với hệ thống tái sử dụng container'
              : 'Quản lý và phê duyệt các yêu cầu tái sử dụng một cách thông minh'
            }
          </p>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={index}
                  variant={action.variant}
                  size="sm"
                  asChild
                  className="text-sm hover:scale-105 transition-transform"
                >
                  <Link href={action.href} className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    {action.label}
                  </Link>
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
} 