import { getCarrierAdminDashboardData } from '@/lib/actions/carrier-admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import CarrierKPICards from '@/components/features/carrier-admin/CarrierKPICards'
import RequestQueueTable from '@/components/features/carrier-admin/RequestQueueTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ship, MapPin, RefreshCw, MessageSquare } from 'lucide-react'
import CodRequestsQueue from '@/components/features/cod/CodRequestsQueue'
import DynamicGreeting from '@/components/common/DynamicGreeting'
import EnhancedEmptyState from '@/components/common/EnhancedEmptyState'
import ErrorBoundary from '@/components/common/ErrorBoundary'

export default async function CarrierAdminPage() {
  // Authentication check
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  if (user.profile?.role !== 'CARRIER_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Page Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Ship className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Cổng Hãng Tàu - Quản lý Yêu Cầu Tái Sử Dụng
            </h1>
            <p className="text-text-secondary mt-1">
              Xem và xử lý các yêu cầu tái sử dụng container cho hãng tàu {user.profile?.organization?.name || 'của bạn'}
            </p>
          </div>
        </div>

        {/* Dynamic Greeting with Quick Actions */}
        <DynamicGreeting 
          userName={user.profile?.full_name || 'Bạn'}
          userRole="CARRIER_ADMIN"
        />
      </div>

      <CarrierDashboardContent />
    </div>
  )
}

async function CarrierDashboardContent() {
  try {
    const dashboardData = await getCarrierAdminDashboardData()
    
    return (
      <>
        {/* KPI Cards */}
        <CarrierKPICards kpis={dashboardData.kpis} />

        {/* Tabs for different request types */}
        <Tabs defaultValue="street-turn" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="street-turn" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Yêu cầu Tái Sử Dụng
            </TabsTrigger>
            <TabsTrigger value="cod" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Yêu cầu Đổi Nơi Trả (COD)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="street-turn" className="space-y-4">
            <div>
              <h3 className="text-h3 font-semibold text-text-primary mb-2">
                Yêu cầu Tái Sử Dụng Chờ Duyệt
              </h3>
              <p className="text-body text-text-secondary mb-4">
                Xem xét và phê duyệt các yêu cầu tái sử dụng container
              </p>
              {dashboardData.pendingRequests.length > 0 ? (
                <RequestQueueTable requests={dashboardData.pendingRequests} />
              ) : (
                <EnhancedEmptyState
                  type="pending-requests"
                  actionHref="/carrier-admin/requests"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="cod" className="space-y-4">
            <div>
              <h3 className="text-h3 font-semibold text-text-primary mb-2">
                Yêu cầu Đổi Nơi Trả (COD)
              </h3>
              <p className="text-body text-text-secondary mb-4">
                Quản lý yêu cầu thay đổi địa điểm trả container
              </p>
              <CodRequestsQueue />
            </div>
          </TabsContent>
        </Tabs>
      </>
    )
  } catch (error: any) {
    console.error('Error fetching carrier admin data:', error)
    return <ErrorBoundary error={error} />
  }
} 