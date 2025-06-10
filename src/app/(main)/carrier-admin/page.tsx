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

        {/* Request Queue Table */}
        <RequestQueueTable requests={dashboardData.pendingRequests} />
      </>
    )
  } catch (error) {
    console.error('Error fetching carrier admin data:', error)
    return (
      <div className="card text-center py-8">
        <p className="text-danger">
          Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.
        </p>
      </div>
    )
  }
} 