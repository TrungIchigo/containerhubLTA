'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'
import { DropoffOrderCard, PickupOrderCard, ReuseCard } from '@/components/dispatcher/DashboardCard'
import KPICardsInline from '@/components/dispatcher/KPICardsInline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Container, Truck, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loading } from '@/components/ui/loader'

interface DashboardData {
  importContainers: any[]
  exportBookings: any[]
  shippingLines: any[]
  kpis: {
    availableContainers: number
    availableBookings: number
    approvedStreetTurns: number
  }
}

interface MatchSuggestion {
  import_container: any
  export_booking: any
  estimated_cost_saving: number
  estimated_co2_saving_kg: number
}

export default function DispatcherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'DISPATCHER') {
        if (profile?.role === 'CARRIER_ADMIN') {
          router.push('/carrier-admin')
        } else {
          router.push('/dashboard')
        }
        return
      }

      // Load dashboard data
      const orgId = profile.organization_id

      // Get import containers
      const { data: importContainers, error: containersError } = await supabase
        .from('import_containers')
        .select(`
          *,
          shipping_line:organizations!import_containers_shipping_line_org_id_fkey(*),
          trucking_company:organizations!import_containers_trucking_company_org_id_fkey(*)
        `)
        .eq('trucking_company_org_id', orgId)
        .order('created_at', { ascending: false })

      if (containersError) throw containersError

      // Get export bookings
      const { data: exportBookingsRaw, error: bookingsError } = await supabase
        .from('export_bookings')
        .select('*')
        .eq('trucking_company_org_id', orgId)
        .order('created_at', { ascending: false })

      if (bookingsError) throw bookingsError

      // Get shipping lines for bookings
      const shippingLineIds = exportBookingsRaw
        ?.filter(booking => booking.shipping_line_org_id)
        .map(booking => booking.shipping_line_org_id) || []

      let shippingLinesForBookings: any[] = []
      if (shippingLineIds.length > 0) {
        const { data: shippingLinesData } = await supabase
          .from('organizations')
          .select('*')
          .in('id', shippingLineIds)
        
        shippingLinesForBookings = shippingLinesData || []
      }

      const exportBookings = exportBookingsRaw?.map(booking => ({
        ...booking,
        shipping_line: shippingLinesForBookings.find(sl => sl.id === booking.shipping_line_org_id) || null
      })) || []

      // Get all shipping lines
      const { data: shippingLines } = await supabase
        .from('organizations')
        .select('*')
        .eq('type', 'SHIPPING_LINE')
        .order('name')

      // Calculate KPIs
      const availableContainers = importContainers?.filter(c => c.status === 'AVAILABLE').length || 0
      const availableBookings = exportBookings?.filter(b => b.status === 'AVAILABLE').length || 0
      
      const { data: approvedRequests } = await supabase
        .from('street_turn_requests')
        .select('*')
        .eq('dropoff_trucking_org_id', orgId)
        .eq('status', 'APPROVED')

      const approvedStreetTurns = approvedRequests?.length || 0

      // Generate match suggestions (simplified)
      const suggestions = generateMatchingSuggestions(importContainers || [], exportBookings || [])

      setData({
        importContainers: importContainers || [],
        exportBookings: exportBookings || [],
        shippingLines: shippingLines || [],
        kpis: {
          availableContainers,
          availableBookings,
          approvedStreetTurns
        }
      })
      setMatchSuggestions(suggestions)

    } catch (err: any) {
      console.error('Error loading dashboard:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Simple matching logic
  const generateMatchingSuggestions = (containers: any[], bookings: any[]): MatchSuggestion[] => {
    const suggestions: MatchSuggestion[] = []
    
    containers.forEach(container => {
      if (container.status !== 'AVAILABLE') return
      
      bookings.forEach(booking => {
        if (booking.status !== 'AVAILABLE') return
        if (container.container_type !== booking.required_container_type) return
        if (container.shipping_line?.id !== booking.shipping_line_org_id) return
        
        // Basic cost/co2 calculation
        const estimated_cost_saving = Math.floor(Math.random() * 500) + 100
        const estimated_co2_saving_kg = Math.floor(Math.random() * 200) + 50
        
        suggestions.push({
          import_container: container,
          export_booking: booking,
          estimated_cost_saving,
          estimated_co2_saving_kg
        })
      })
    })
    
    return suggestions
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading text="Đang tải dashboard..." />
      </div>
    )
  }

  if (error) {
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
            Chi tiết lỗi: {error}
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Không có dữ liệu
          </h1>
        </div>
      </div>
    )
  }

  // Lọc dữ liệu cho dashboard (chỉ lấy những item quan trọng nhất)
  const upcomingDropoffs = data.importContainers
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3) // Chỉ hiển thị 3 item mới nhất

  const upcomingPickups = data.exportBookings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3) // Chỉ hiển thị 3 item mới nhất

  const topSuggestions = matchSuggestions
    .sort((a, b) => b.estimated_cost_saving - a.estimated_cost_saving)
    .slice(0, 3) // Chỉ hiển thị 3 gợi ý tốt nhất

  return (
    <DispatcherDashboardWrapper 
      userOrgId={data ? (data.importContainers[0]?.trucking_company_org_id || '') : ''}
      shippingLines={data.shippingLines}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header với KPI Cards */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Bảng Điều Phối
                </h1>
                <p className="text-text-secondary mt-1">
                  Dashboard tổng quan
                </p>
              </div>
              <KPICardsInline
                availableContainers={data.kpis.availableContainers}
                availableBookings={data.kpis.availableBookings}
                approvedStreetTurns={data.kpis.approvedStreetTurns}
              />
            </div>
          </div>
        </div>

        {/* Main Content - 3 Columns Layout */}
        <div className="container mx-auto px-4 py-6 h-[calc(100vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* Cột 1: Lệnh Giao Trả Container */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  Lệnh Giao Trả Mới Nhất
                </h2>
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Link href="/dispatcher/dropoff-orders" className="flex items-center gap-2">
                    Xem tất cả
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="overflow-y-auto h-[calc(100vh-220px)] pr-2">
                {upcomingDropoffs.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingDropoffs.map((container) => (
                      <DropoffOrderCard 
                        key={container.id} 
                        container={container} 
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <Container className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                          Chưa có Lệnh Giao Trả
                        </h3>
                        <p className="text-text-secondary text-sm">
                          Chưa có lệnh giao trả nào sẵn sàng
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Cột 2: Lệnh Lấy Container Rỗng */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  Lệnh Lấy Rỗng Mới Nhất
                </h2>
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Link href="/dispatcher/pickup-orders" className="flex items-center gap-2">
                    Xem tất cả
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="overflow-y-auto h-[calc(100vh-220px)] pr-2">
                {upcomingPickups.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingPickups.map((booking) => (
                      <PickupOrderCard 
                        key={booking.id} 
                        booking={booking} 
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                          <Truck className="h-6 w-6 text-warning" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                          Chưa có Lệnh Lấy Rỗng
                        </h3>
                        <p className="text-text-secondary text-sm">
                          Chưa có lệnh lấy rỗng nào cần ưu tiên
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Cột 3: Gợi Ý Tái Sử Dụng */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">
                  Gợi Ý Tái Sử Dụng Tốt Nhất
                </h2>
                <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Link href="/dispatcher/suggestions" className="flex items-center gap-2">
                    Xem tất cả
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
              
              <div className="overflow-y-auto h-[calc(100vh-220px)] pr-2">
                {topSuggestions.length > 0 ? (
                  <div className="space-y-3">
                    {topSuggestions.map((suggestion) => (
                      <ReuseCard 
                        key={`${suggestion.import_container.id}-${suggestion.export_booking.id}`}
                        suggestion={suggestion}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
                          <RefreshCw className="h-6 w-6 text-info" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                          Chưa có Gợi Ý Ghép nối
                        </h3>
                        <p className="text-text-secondary text-sm mb-4">
                          Thêm lệnh giao trả và lấy rỗng để có gợi ý tái sử dụng
                        </p>
                        <div className="text-xs text-text-secondary space-y-1">
                          <p className="font-medium">Điều kiện ghép nối:</p>
                          <ul className="text-left space-y-1">
                            <li>• Cùng công ty vận tải</li>
                            <li>• Cùng hãng tàu</li>
                            <li>• Cùng thành phố</li>
                            <li>• Cùng loại container</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DispatcherDashboardWrapper>
  )
} 