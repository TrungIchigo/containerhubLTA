import { Suspense } from 'react'
import { BillingDashboard } from '@/components/features/billing/BillingDashboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Receipt } from 'lucide-react'

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
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Đang tải dữ liệu thanh toán...</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <BillingDashboard />
      </Suspense>
    </div>
  )
} 