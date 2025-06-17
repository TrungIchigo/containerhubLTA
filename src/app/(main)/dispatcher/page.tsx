import { getDispatcherDashboardData } from '@/lib/actions/dispatcher'
import { generateMatchingSuggestions } from '@/lib/utils/dispatcher'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import KPICards from '@/components/dispatcher/KPICards'
import ImportContainersTable from '@/components/dispatcher/ImportContainersTable'
import ExportBookingsTable from '@/components/dispatcher/ExportBookingsTable'
import MatchSuggestions from '@/components/dispatcher/MatchSuggestions'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'
import DynamicGreeting from '@/components/common/DynamicGreeting'
import EnhancedEmptyState from '@/components/common/EnhancedEmptyState'

export default async function DispatcherPage() {
  // Kiểm tra authentication và authorization
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.profile?.role !== 'DISPATCHER') {
    // Redirect to appropriate page based on role
    if (user.profile?.role === 'CARRIER_ADMIN') {
      redirect('/carrier-admin')
    } else {
      redirect('/dashboard')
    }
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
      <DispatcherDashboardWrapper 
        userOrgId={user.profile?.organization_id || ''}
        shippingLines={data.shippingLines}
      >
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Enhanced Header with Dynamic Greeting */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Bảng Điều Phối
                </h1>
                <p className="text-text-secondary">
                  Quản lý Lệnh Giao Trả và Lệnh Lấy Rỗng của {user.profile?.organization?.name}
                </p>
              </div>
              
              {/* Dynamic Greeting with Quick Actions */}
              <DynamicGreeting 
                userName={user.profile?.full_name || 'Bạn'}
                userRole="DISPATCHER"
              />
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
              <div className="space-y-4">
                <div>
                  <h2 className="text-h2 font-semibold text-text-primary mb-2">
                    Lệnh Giao Trả Container
                  </h2>
                  <p className="text-body text-text-secondary">
                    Quản lý container sẵn sàng để tái sử dụng
                  </p>
                </div>
                {data.importContainers.length > 0 ? (
                  <ImportContainersTable
                    containers={data.importContainers}
                    shippingLines={data.shippingLines}
                  />
                ) : (
                  <EnhancedEmptyState
                    type="import-containers"
                    actionHref="/dispatcher?action=add-import"
                  />
                )}
              </div>

              {/* Export Bookings Table */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-h2 font-semibold text-text-primary mb-2">
                    Lệnh Lấy Container Rỗng
                  </h2>
                  <p className="text-body text-text-secondary">
                    Quản lý booking cần container rỗng
                  </p>
                </div>
                {data.exportBookings.length > 0 ? (
                  <ExportBookingsTable
                    bookings={data.exportBookings}
                  />
                ) : (
                  <EnhancedEmptyState
                    type="export-bookings"
                    actionHref="/dispatcher?action=add-export"
                  />
                )}
              </div>

              {/* Match Suggestions */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-h2 font-semibold text-text-primary mb-2">
                    Gợi Ý Tái Sử Dụng
                  </h2>
                  <p className="text-body text-text-secondary">
                    Cơ hội ghép nối container để tiết kiệm chi phí
                  </p>
                </div>
                {matchSuggestions.length > 0 ? (
                  <MatchSuggestions
                    suggestions={matchSuggestions}
                  />
                ) : (
                  <EnhancedEmptyState
                    type="street-turn-requests"
                    title="Chưa có Gợi Ý Ghép nối"
                    description="Hãy thêm lệnh giao trả và lệnh lấy rỗng để hệ thống tạo gợi ý tái sử dụng container phù hợp."
                    actionLabel="Xem Hướng dẫn"
                    actionHref="/help/matching"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </DispatcherDashboardWrapper>
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