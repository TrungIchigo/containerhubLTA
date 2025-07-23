'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

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
  const [greeting, setGreeting] = useState('Xin chào') // fallback for SSR

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

  return (
    <Card className={`p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-border/50 ${className}`}>
      <div>
        {/* Greeting Section */}
        <div>
          <h2 className="text-h2 font-semibold text-text-primary mb-1" suppressHydrationWarning>
            {greeting}, {userName}!
          </h2>
          <p className="text-body text-text-secondary">
            {userRole === 'DISPATCHER' 
              ? 'Hãy bắt đầu ngày làm việc hiệu quả với hệ thống tái sử dụng container'
              : 'Quản lý và phê duyệt các yêu cầu tái sử dụng một cách thông minh'
            }
          </p>
        </div>
      </div>
    </Card>
  )
} 