'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SuggestionLeaderboard } from '@/components/features/dispatcher/dashboard/SuggestionLeaderboard'
import { FullDropOffOrdersTable } from '@/components/features/dispatcher/dashboard/FullDropOffOrdersTable'
import { FullPickupOrdersTable } from '@/components/features/dispatcher/dashboard/FullPickupOrdersTable'
import { ContextualSidebar } from '@/components/features/dispatcher/dashboard/ContextualSidebar'
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
  const [userOrgId, setUserOrgId] = useState<string>("")

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
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
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) {
        setError('Không tìm thấy thông tin tổ chức')
        return
      }

      if (profile.role !== 'DISPATCHER') {
        if (profile.role === 'CARRIER_ADMIN') {
          router.push('/carrier-admin')
          return
        } else if (profile.role === 'LTA_ADMIN') {
          router.push('/admin/dashboard')
          return
        } else {
          setError('Bạn không có quyền truy cập trang này')
          return
        }
      }

      setUserOrgId(profile.organization_id)

      // Load data in parallel
      const [
        importContainersResult,
        exportBookingsResult,
        shippingLinesResult,
        streetTurnsResult
      ] = await Promise.all([
        // Import containers - sử dụng trucking_company_org_id
        supabase
          .from('import_containers')
          .select(`
            id,
            container_number,
            container_type,
            status,
            drop_off_location,
            available_from_datetime,
            created_at,
            trucking_company_org_id,
            shipping_line_org_id,
            trucking_company:organizations!trucking_company_org_id (
              id,
              name
            ),
            shipping_line:organizations!shipping_line_org_id (
              id,
              name
            )
          `)
          .eq('trucking_company_org_id', profile.organization_id)
          .order('created_at', { ascending: false }),

        // Export bookings - sử dụng trucking_company_org_id
        supabase
          .from('export_bookings')
          .select(`
            id,
            booking_number,
            required_container_type,
            status,
            pick_up_location,
            needed_by_datetime,
            created_at,
            trucking_company_org_id,
            trucking_company:organizations!trucking_company_org_id (
              id,
              name
            )
          `)
          .eq('trucking_company_org_id', profile.organization_id)
          .order('created_at', { ascending: false }),

        // Shipping lines
        supabase
          .from('organizations')
          .select('id, name, type')
          .eq('type', 'SHIPPING_LINE')
          .order('name'),

        // Street turns for KPIs
        supabase
          .from('street_turn_requests')
          .select('id, status')
          .eq('dropoff_trucking_org_id', profile.organization_id)
          .eq('status', 'APPROVED')
      ])

      if (importContainersResult.error) {
        console.error('Error loading import containers:', importContainersResult.error)
        throw new Error('Lỗi tải dữ liệu container')
      }

      if (exportBookingsResult.error) {
        console.error('Error loading export bookings:', exportBookingsResult.error)
        throw new Error('Lỗi tải dữ liệu booking')
      }

      if (shippingLinesResult.error) {
        console.error('Error loading shipping lines:', shippingLinesResult.error)
        throw new Error('Lỗi tải dữ liệu hãng tàu')
      }

      const importContainers = importContainersResult.data || []
      const exportBookings = exportBookingsResult.data || []
      const shippingLines = shippingLinesResult.data || []
      const approvedStreetTurns = streetTurnsResult.data?.length || 0

      // Transform data to include shipping_line reference
      const transformedImportContainers = importContainers.map(container => ({
        ...container,
        shipping_line: container.shipping_line?.[0] || container.trucking_company?.[0]
      }))

      const transformedExportBookings = exportBookings.map(booking => ({
        ...booking,
        shipping_line: booking.trucking_company?.[0]
      }))

      // Calculate KPIs
      const availableContainers = importContainers.filter(c => c.status === 'AVAILABLE').length
      const availableBookings = exportBookings.filter(b => b.status === 'AVAILABLE').length

      const dashboardData: DashboardData = {
        importContainers: transformedImportContainers,
        exportBookings: transformedExportBookings,
        shippingLines,
        kpis: {
          availableContainers,
          availableBookings,
          approvedStreetTurns
        }
      }

      setData(dashboardData)

      // Generate match suggestions using client-side algorithm
      const suggestions = generateMatchSuggestions(transformedImportContainers, transformedExportBookings)
      setMatchSuggestions(suggestions)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const generateMatchSuggestions = (importContainers: any[], exportBookings: any[]): MatchSuggestion[] => {
    const suggestions: MatchSuggestion[] = []

    const availableContainers = importContainers.filter(c => c.status === 'AVAILABLE')
    const availableBookings = exportBookings.filter(b => b.status === 'AVAILABLE')

    for (const container of availableContainers) {
      for (const booking of availableBookings) {
        // Basic matching criteria
        const containerTypeMatch = container.container_type === booking.required_container_type
        const sameOrganization = container.trucking_company_org_id === booking.trucking_company_org_id

        if (containerTypeMatch && sameOrganization) {
          // Calculate estimated savings (simplified algorithm)
          const baseSaving = 500000 // 500k VND base saving
          const typeFactor = container.container_type.includes('40') ? 1.5 : 1.0
          const timeFactor = Math.random() * 0.5 + 0.8 // 0.8 to 1.3
          
          const estimatedCostSaving = Math.round(baseSaving * typeFactor * timeFactor)
          const estimatedCo2Saving = Math.round(estimatedCostSaving / 10000) // Simplified CO2 calculation

          suggestions.push({
            import_container: container,
            export_booking: booking,
            estimated_cost_saving: estimatedCostSaving,
            estimated_co2_saving_kg: estimatedCo2Saving
          })
        }
      }
    }

    // Sort by cost saving (highest first) and limit to top 10
    return suggestions
      .sort((a, b) => b.estimated_cost_saving - a.estimated_cost_saving)
      .slice(0, 10)
  }

  if (loading) {
    return (
      <DispatcherDashboardWrapper 
        kpis={{
          availableContainers: 0,
          availableBookings: 0,
          approvedStreetTurns: 0
        }}
      >
        <div className="flex items-center justify-center h-96">
          <Loading size="lg" text="Đang tải dữ liệu..." />
        </div>
      </DispatcherDashboardWrapper>
    )
  }

  if (error) {
    return (
      <DispatcherDashboardWrapper 
        kpis={{
          availableContainers: 0,
          availableBookings: 0,
          approvedStreetTurns: 0
        }}
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Lỗi tải dữ liệu</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
            >
              Thử lại
            </button>
          </div>
        </div>
      </DispatcherDashboardWrapper>
    )
  }

  if (!data) {
    return (
      <DispatcherDashboardWrapper 
        kpis={{
          availableContainers: 0,
          availableBookings: 0,
          approvedStreetTurns: 0
        }}
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Không có dữ liệu</div>
        </div>
      </DispatcherDashboardWrapper>
    )
  }

  return (
    <DispatcherDashboardWrapper kpis={data.kpis}>
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - 3 columns */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="suggestions" className="h-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="suggestions" className="flex items-center gap-2">
                🔄 Gợi ý Tái sử dụng
              </TabsTrigger>
              <TabsTrigger value="dropoff" className="flex items-center gap-2">
                📦 Lệnh Giao Trả
              </TabsTrigger>
              <TabsTrigger value="pickup" className="flex items-center gap-2">
                🚛 Lệnh Lấy Rỗng
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="h-[calc(100vh-200px)]">
              <SuggestionLeaderboard 
                suggestions={matchSuggestions}
                importContainers={data.importContainers}
                exportBookings={data.exportBookings}
              />
            </TabsContent>

            <TabsContent value="dropoff" className="h-[calc(100vh-200px)]">
              <FullDropOffOrdersTable importContainers={data.importContainers} />
            </TabsContent>

            <TabsContent value="pickup" className="h-[calc(100vh-200px)]">
              <FullPickupOrdersTable exportBookings={data.exportBookings} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Contextual Sidebar - 1 column */}
        <div className="lg:col-span-1 h-[calc(100vh-200px)]">
          <ContextualSidebar
            importContainers={data.importContainers}
            exportBookings={data.exportBookings}
            matchSuggestions={matchSuggestions}
          />
        </div>
      </div>
    </DispatcherDashboardWrapper>
  )
} 