import { getDispatcherDashboardData } from '@/lib/actions/dispatcher'
import { generateMatchingSuggestions } from '@/lib/utils/dispatcher'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import KPICards from '@/components/dispatcher/KPICards'
import ImportContainersTable from '@/components/dispatcher/ImportContainersTable'
import ExportBookingsTable from '@/components/dispatcher/ExportBookingsTable'
import MatchSuggestions from '@/components/dispatcher/MatchSuggestions'

export default async function DispatcherPage() {
  // Kiểm tra authentication và authorization
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.profile?.role !== 'DISPATCHER') {
    redirect('/login')
  }

  try {
    // Lấy dữ liệu dashboard
    const data = await getDispatcherDashboardData()
    
    // Tạo gợi ý ghép nối
    const matchSuggestions = generateMatchingSuggestions(
      data.importContainers,
      data.exportBookings
    )

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Dashboard Điều Phối Viên
            </h1>
            <p className="text-text-secondary">
              Chào mừng {user.profile?.full_name}! Quản lý container và booking của {user.profile?.organization?.name}
            </p>
          </div>

          {/* KPI Cards */}
          <KPICards
            availableContainers={data.kpis.availableContainers}
            availableBookings={data.kpis.availableBookings}
            approvedStreetTurns={data.kpis.approvedStreetTurns}
          />

          {/* Management Tables */}
          <div className="space-y-8">
            {/* Import Containers Table */}
            <ImportContainersTable
              containers={data.importContainers}
              shippingLines={data.shippingLines}
            />

            {/* Export Bookings Table */}
            <ExportBookingsTable
              bookings={data.exportBookings}
            />

            {/* Match Suggestions */}
            <MatchSuggestions
              suggestions={matchSuggestions}
            />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading dispatcher dashboard:', error)
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Có lỗi xảy ra
          </h1>
          <p className="text-text-secondary mb-6">
            Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.
          </p>
          <p className="text-sm text-text-secondary">
            Chi tiết lỗi: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }
} 