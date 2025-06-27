import { Suspense } from 'react'
import React from 'react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminBillingDashboard } from '@/components/admin/AdminBillingDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Receipt, Building2 } from 'lucide-react'

export default function AdminBillingPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <AdminHeader 
        title="Quản Lý Tài Chính" 
        description="Quản lý giao dịch, hóa đơn và thanh toán"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao Dịch</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Tổng giao dịch trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hóa Đơn</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Hóa đơn chờ thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh Thu</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Tổng doanh thu tháng này
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense 
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="loader mx-auto" style={{
                  width: '85px',
                  height: '50px',
                  '--g1': 'conic-gradient(from 90deg at left 3px top 3px, #0000 90deg, #4CAF50 0)',
                  '--g2': 'conic-gradient(from -90deg at bottom 3px right 3px, #0000 90deg, #4CAF50 0)',
                  background: 'var(--g1), var(--g1), var(--g1), var(--g2), var(--g2), var(--g2)',
                  backgroundPosition: 'left, center, right',
                  backgroundRepeat: 'no-repeat',
                  animation: 'wave-loader 1s infinite'
                } as React.CSSProperties} />
                <p className="text-sm text-muted-foreground mt-2">Đang tải dữ liệu...</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <AdminBillingDashboard />
      </Suspense>
    </div>
  )
} 