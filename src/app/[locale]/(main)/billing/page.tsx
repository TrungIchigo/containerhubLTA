import { Suspense } from 'react'
import React from 'react'
import { BillingDashboard } from '@/components/features/billing/BillingDashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Receipt } from 'lucide-react'

export default function BillingPage() {
  return (
    <div className="container-spacing">
      {/* Page Header - Simple and consistent with other pages */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-h1 font-bold text-text-primary">
              Thanh Toán & Hóa Đơn
            </h1>
            <p className="text-body text-text-secondary">
              Quản lý các giao dịch và hóa đơn một cách minh bạch
            </p>
          </div>
        </div>
      </div>

      <Suspense 
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="loader" style={{
                width: '85px',
                height: '50px',
                '--g1': 'conic-gradient(from 90deg at left 3px top 3px, #0000 90deg, #4CAF50 0)',
                '--g2': 'conic-gradient(from -90deg at bottom 3px right 3px, #0000 90deg, #4CAF50 0)',
                background: 'var(--g1), var(--g1), var(--g1), var(--g2), var(--g2), var(--g2)',
                backgroundPosition: 'left, center, right',
                backgroundRepeat: 'no-repeat',
                animation: 'wave-loader 1s infinite'
              } as React.CSSProperties} />
              <p className="text-sm text-muted-foreground mt-2">Đang tải dữ liệu thanh toán...</p>
            </CardContent>
          </Card>
        }
      >
        <BillingDashboard />
      </Suspense>
    </div>
  )
} 