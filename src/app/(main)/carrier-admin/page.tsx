import { getCarrierAdminDashboardData } from '@/lib/actions/carrier-admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import CarrierKPICards from '@/components/features/carrier-admin/CarrierKPICards'
import RequestQueueTable from '@/components/features/carrier-admin/RequestQueueTable'
import { Ship } from 'lucide-react'

export default async function CarrierAdminPage() {
  // Authentication check
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  if (user.profile?.role !== 'CARRIER_ADMIN') {
    redirect('/dashboard')
  }

  // Fetch dashboard data
  let dashboardData
  try {
    dashboardData = await getCarrierAdminDashboardData()
  } catch (error) {
    console.error('Error fetching carrier admin data:', error)
    // Fallback data
    dashboardData = {
      pendingRequests: [],
      kpis: {
        pendingCount: 0,
        approvedThisMonth: 0,
        totalApproved: 0
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <Ship className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Quản lý Yêu cầu Street-Turn
          </h1>
          <p className="text-text-secondary mt-1">
            Xem và xử lý các yêu cầu street-turn cho hãng tàu {user.profile?.organization?.name}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <CarrierKPICards kpis={dashboardData.kpis} />

      {/* Request Queue Table */}
      <RequestQueueTable requests={dashboardData.pendingRequests} />
    </div>
  )
} 