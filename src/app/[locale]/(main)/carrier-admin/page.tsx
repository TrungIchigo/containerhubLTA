import { getCarrierAdminDashboardData } from '@/lib/actions/carrier-admin'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { CarrierKPICardsInline } from '@/components/features/carrier-admin/CarrierKPICards'
import { CodRequestCard, StreetTurnRequestCard, ApprovedCodRequestCard } from '@/components/features/carrier-admin/CarrierDashboardCards'
import { Ship, MapPin, RefreshCw, MessageSquare, Clock, ArrowRight, CheckCircle2 } from 'lucide-react'
import DynamicGreeting from '@/components/common/DynamicGreeting'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
    <CarrierDashboardContent user={user} />
  )
}

async function CarrierDashboardContent({ user }: { user: any }) {
  try {
    const dashboardData = await getCarrierAdminDashboardData()
    
    // Transform COD requests for dashboard display
    const codRequests = dashboardData.codRequests.map((request: any) => ({
      id: request.id,
      container_number: request.import_container?.container_number || 'N/A',
      booking_number: request.import_container?.id || 'N/A',
      original_location: request.original_depot_address || 'N/A',
      requested_location: request.requested_depot?.name || 'N/A',
      reason: request.reason_for_request || 'Không có lý do',
      status: request.status,
      created_at: request.created_at,
      requested_by_org: { name: request.requesting_org?.name || 'N/A' },
      fee_amount: request.cod_fee || 0
    }))

    // Transform Street Turn requests for dashboard display
    const streetTurnRequests = dashboardData.pendingRequests.map((request: any) => ({
      id: request.id,
      container_number: request.import_container?.container_number || 'N/A',
      pickup_company_name: request.dropoff_trucking_org?.name || 'N/A',
      pickup_location: request.import_container?.drop_off_location || 'N/A',
      dropoff_location: request.export_booking?.pick_up_location || 'N/A',
      status: request.status,
      created_at: request.created_at,
      needed_by_datetime: request.export_booking?.needed_by_datetime || request.created_at,
      cost_saving: request.estimated_cost_saving || 0,
      co2_saving: request.estimated_co2_saving_kg || 0
    }))

    // Filter approved but unpaid COD requests
    const approvedCodRequests = codRequests.filter((request: any) => 
      ['APPROVED', 'PENDING_PAYMENT'].includes(request.status)
    )

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header với KPI Cards */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Ship className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-text-primary">
                    Cổng Hãng Tàu
                  </h1>
                  <p className="text-text-secondary mt-1">
                    Dashboard tổng quan - {user.profile?.organization?.name || 'Hapag-Lloyd Vietnam'}
                  </p>
                </div>
              </div>
              <CarrierKPICardsInline
                pendingCodRequests={dashboardData.kpis.pendingCodRequests}
                pendingStreetTurnRequests={dashboardData.kpis.pendingCount}
                approvedButUnpaidCodRequests={dashboardData.kpis.approvedButUnpaidCodRequests}
              />
            </div>
          </div>
        </div>

        {/* Main Content - 3 Columns Layout */}
        <div className="container mx-auto px-4 py-6 h-[calc(100vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* Cột 1: Yêu cầu COD */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  Yêu cầu COD Mới Nhất
                </h2>
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Link href="/carrier-admin/cod-requests" className="flex items-center gap-2">
                    Xem tất cả
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="overflow-y-auto h-[calc(100vh-220px)] pr-2">
                {codRequests.length > 0 ? (
                  <div className="space-y-3">
                    {codRequests.slice(0, 3).map((request: any) => (
                      <CodRequestCard 
                        key={request.id} 
                        request={request} 
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                          Chưa có Yêu cầu COD
                        </h3>
                        <p className="text-text-secondary text-sm">
                          Chưa có yêu cầu đổi nơi trả nào
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Cột 2: Yêu cầu Tái Sử Dụng */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  Yêu cầu Tái Sử Dụng Mới Nhất
                </h2>
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Link href="/carrier-admin/street-turn-requests" className="flex items-center gap-2">
                    Xem tất cả
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="overflow-y-auto h-[calc(100vh-220px)] pr-2">
                {streetTurnRequests.length > 0 ? (
                  <div className="space-y-3">
                    {streetTurnRequests.slice(0, 3).map((request: any) => (
                      <StreetTurnRequestCard 
                        key={request.id} 
                        request={request} 
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                          <RefreshCw className="h-6 w-6 text-warning" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                          Chưa có Yêu cầu Tái Sử Dụng
                        </h3>
                        <p className="text-text-secondary text-sm">
                          Chưa có yêu cầu tái sử dụng container nào
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Cột 3: COD Đã Duyệt Chưa Thanh Toán */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  COD Đã Duyệt Chưa Thanh Toán
                </h2>
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Link href="/carrier-admin/approved-cod-requests" className="flex items-center gap-2">
                    Xem tất cả
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="overflow-y-auto h-[calc(100vh-220px)] pr-2">
                {approvedCodRequests.length > 0 ? (
                  <div className="space-y-3">
                    {approvedCodRequests.slice(0, 3).map((request: any) => (
                      <ApprovedCodRequestCard 
                        key={request.id} 
                        request={request} 
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
                          <CheckCircle2 className="h-6 w-6 text-info" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                          Không có COD chờ thanh toán
                        </h3>
                        <p className="text-text-secondary text-sm">
                          Tất cả COD đã được thanh toán
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading carrier admin dashboard:', error)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Có lỗi xảy ra khi tải dữ liệu
          </h2>
          <p className="text-text-secondary">
            Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.
          </p>
        </div>
      </div>
    )
  }
} 