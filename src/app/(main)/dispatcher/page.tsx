'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'
import { TabsContent } from '@/components/ui/tabs'
import { SuggestionLeaderboard } from '@/components/features/dispatcher/dashboard/SuggestionLeaderboard'
import { FullDropOffOrdersTable } from '@/components/features/dispatcher/dashboard/FullDropOffOrdersTable'
import { FullPickupOrdersTable } from '@/components/features/dispatcher/dashboard/FullPickupOrdersTable'
import { ContextualSidebar } from '@/components/features/dispatcher/dashboard/ContextualSidebar'
import { PageHeader } from '@/components/features/dispatcher/dashboard/PageHeader'
import { createClient } from '@/lib/supabase/client'
import { LtaLoadingInline } from '@/components/ui/ltaloading'
import { Plus } from 'lucide-react'
import CreateContainerDialog from '@/components/features/dispatcher/CreateContainerDialog'
import CreateBookingDialog from '@/components/features/dispatcher/CreateBookingDialog'
import Pagination from '@/components/common/Pagination'
import ContainerFilters from '@/components/dispatcher/ContainerFilters'
import BookingFilters from '@/components/dispatcher/BookingFilters'
import { useToast } from '@/hooks/use-toast'

import { CodPaymentDialog } from '@/components/features/cod/CodPaymentDialog'
import { ConfirmDepotCompletionDialog } from '@/components/dialogs/ConfirmDepotCompletionDialog'
import { OrderDetailModal } from '@/components/features/dispatcher/dashboard/OrderDetailModal'
import CodRequestDialog from '@/components/features/cod/CodRequestDialog'

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
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([])
  const [userOrgId, setUserOrgId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("dropoff")
  const [containerFilters, setContainerFilters] = useState<any>({ pageSize: 10, page: 1 })
  const [bookingFilters, setBookingFilters] = useState<any>({ pageSize: 10, page: 1 })
  const [showCreateContainer, setShowCreateContainer] = useState(false)
  const [showCreateBooking, setShowCreateBooking] = useState(false)

  const [showCodPayment, setShowCodPayment] = useState(false)
  const [showDepotCompletion, setShowDepotCompletion] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<any>(null)
  const [pendingCodPayment, setPendingCodPayment] = useState<any>(null)
  const [depotCompletionContainer, setDepotCompletionContainer] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null)
  const [showCodRequest, setShowCodRequest] = useState(false)
  const [codRequestContainer, setCodRequestContainer] = useState<any>(null)

  // Filter data based on current filters
  const getFilteredImportContainers = () => {
    if (!data?.importContainers) return []
    
    let filtered = [...data.importContainers]

    // Filter by container type
    if (containerFilters.containerTypeId && containerFilters.containerTypeId !== 'all') {
      filtered = filtered.filter(container => container.container_type_id === containerFilters.containerTypeId)
    }

    // Filter by shipping line
    if (containerFilters.shippingLineId && containerFilters.shippingLineId !== 'all') {
      filtered = filtered.filter(container => container.shipping_line_org_id === containerFilters.shippingLineId)
    }

    // Filter by date range
    if (containerFilters.fromDate) {
      filtered = filtered.filter(container => 
        new Date(container.available_from_datetime) >= new Date(containerFilters.fromDate)
      )
    }

    if (containerFilters.toDate) {
      filtered = filtered.filter(container => 
        new Date(container.available_from_datetime) <= new Date(containerFilters.toDate)
      )
    }

    // Filter by statuses
    if (containerFilters.statuses && containerFilters.statuses.length > 0) {
      filtered = filtered.filter(container => 
        containerFilters.statuses.includes(container.status)
      )
    }

    // Sort
    if (containerFilters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[containerFilters.sortBy]
        const bValue = b[containerFilters.sortBy]
        
        if (containerFilters.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    return filtered
  }

  const getFilteredExportBookings = () => {
    if (!data?.exportBookings) return []
    
    let filtered = [...data.exportBookings]

    // Filter by container type
    if (bookingFilters.containerTypeId && bookingFilters.containerTypeId !== 'all') {
      filtered = filtered.filter(booking => booking.required_container_type_id === bookingFilters.containerTypeId)
    }

    // Filter by shipping line
    if (bookingFilters.shippingLineId && bookingFilters.shippingLineId !== 'all') {
      filtered = filtered.filter(booking => booking.shipping_line_org_id === bookingFilters.shippingLineId)
    }

    // Filter by date range
    if (bookingFilters.fromDate) {
      filtered = filtered.filter(booking => 
        new Date(booking.needed_by_datetime) >= new Date(bookingFilters.fromDate)
      )
    }

    if (bookingFilters.toDate) {
      filtered = filtered.filter(booking => 
        new Date(booking.needed_by_datetime) <= new Date(bookingFilters.toDate)
      )
    }

    // Filter by statuses
    if (bookingFilters.statuses && bookingFilters.statuses.length > 0) {
      filtered = filtered.filter(booking => 
        bookingFilters.statuses.includes(booking.status)
      )
    }

    // Sort
    if (bookingFilters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[bookingFilters.sortBy]
        const bValue = b[bookingFilters.sortBy]
        
        if (bookingFilters.sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    return filtered
  }

  const filteredImportContainers = getFilteredImportContainers()
  const filteredExportBookings = getFilteredExportBookings()

  // Apply pagination to filtered data
  const getPaginatedImportContainers = () => {
    const page = containerFilters.page || 1
    const pageSize = containerFilters.pageSize || 10
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredImportContainers.slice(startIndex, endIndex)
  }

  const getPaginatedExportBookings = () => {
    const page = bookingFilters.page || 1
    const pageSize = bookingFilters.pageSize || 10
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredExportBookings.slice(startIndex, endIndex)
  }

  const paginatedImportContainers = getPaginatedImportContainers()
  const paginatedExportBookings = getPaginatedExportBookings()

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Reset page to 1 when filters change (except page and pageSize changes)
  useEffect(() => {
    if (containerFilters.page && containerFilters.page > 1) {
      // Only reset if we're not already on page 1
      setContainerFilters(prev => ({ ...prev, page: 1 }))
    }
  }, [containerFilters.containerTypeId, containerFilters.shippingLineId, containerFilters.fromDate, containerFilters.toDate, containerFilters.statuses])

  useEffect(() => {
    if (bookingFilters.page && bookingFilters.page > 1) {
      // Only reset if we're not already on page 1
      setBookingFilters(prev => ({ ...prev, page: 1 }))
    }
  }, [bookingFilters.containerTypeId, bookingFilters.shippingLineId, bookingFilters.fromDate, bookingFilters.toDate, bookingFilters.statuses])

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
            depot_id,
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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleStatusFilterChange = (status: string) => {
    // Implement status filtering logic
    console.log('Status filter changed:', status)
  }

  const handleDateFilterChange = (date: Date | undefined) => {
    // Implement date filtering logic
    console.log('Date filter changed:', date)
  }

  const handleSortChange = (sortBy: string) => {
    // Implement sorting logic
    console.log('Sort changed:', sortBy)
  }

  // Handler functions for action buttons
  const handleViewDetails = (item: any) => {
    console.log('View details:', item)
    setSelectedDetailItem(item)
    setShowDetailModal(true)
  }

  const handleRequestCod = async (container: any) => {
    try {
      console.log('Requesting COD for container:', container.id)
      // Mở popup CodRequestDialog
      setCodRequestContainer(container)
      setShowCodRequest(true)
    } catch (error) {
      console.error('Error requesting COD:', error)
      toast({
          title: "Lỗi",
          description: 'Không thể tạo yêu cầu COD',
          variant: "destructive"
        })
    }
  }

  const handleCloseCodRequest = () => {
    setShowCodRequest(false)
    setCodRequestContainer(null)
  }

  const handleCodRequestSuccess = () => {
    handleCloseCodRequest()
    // Refresh data to show updated container status
    loadDashboardData()
    toast({
      title: "✅ Thành công",
      description: 'Yêu cầu COD đã được gửi thành công',
      variant: "default"
    })
  }

  const handlePayCodFee = async (container: any) => {
    try {
      console.log('Paying COD fee for container:', container.id)
      
      // Get COD request for this container
      const response = await fetch('/api/cod/container-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId: container.id })
      })
      
      if (!response.ok) {
        throw new Error('Không thể lấy thông tin COD request')
      }
      
      const result = await response.json()
      const codRequest = result.data?.find((r: any) => r.cod_fee > 0)
      
      if (!codRequest) {
        toast({
          title: "Lỗi",
          description: 'Không tìm thấy phí COD cần thanh toán',
          variant: "destructive"
        })
        return
      }
      
      // Create pending COD payment object for dialog
      const pendingPayment = {
        id: codRequest.id,
        status: 'AWAITING_COD_PAYMENT',
        cod_fee: codRequest.cod_fee,
        delivery_confirmed_at: new Date().toISOString(),
        container_number: container.container_number,
        requesting_org_name: codRequest.requesting_org_name || 'N/A',
        original_depot_address: container.original_depot_address,
        requested_depot_name: codRequest.requested_depot_name,
        created_at: codRequest.created_at || new Date().toISOString(),
        // Additional fields for payment processing
        service_fee: codRequest.service_fee || 0,
        total_amount: codRequest.cod_fee + (codRequest.service_fee || 0),
        container_id: container.id,
        cod_request_id: codRequest.id
      }
      
      setPendingCodPayment(pendingPayment)
      setShowCodPayment(true)
    } catch (error) {
      console.error('Error paying COD fee:', error)
      toast({
          title: "Lỗi",
          description: 'Không thể thanh toán phí COD',
          variant: "destructive"
        })
    }
  }

  const handleConfirmCodDelivery = async (container: any) => {
    try {
      console.log('Confirming COD delivery for container:', container.id)
      
      const response = await fetch('/api/cod/carrier-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmCodDelivery',
          containerId: container.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Không thể xác nhận giao hàng COD')
      }
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message,
          variant: "success"
        })
        loadDashboardData() // Refresh data
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error confirming COD delivery:', error)
      toast({
          title: "Lỗi",
          description: error.message || "Không thể xác nhận giao hàng COD",
          variant: "destructive"
        })
    }
  }



  const handleConfirmDepotCompletion = async (container: any) => {
    setDepotCompletionContainer(container)
    setShowDepotCompletion(true)
  }

  const handleDepotCompletionConfirm = async (containerId: string) => {
    try {
      console.log('Confirming depot completion for container:', containerId)
      
      const response = await fetch('/api/cod/carrier-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_depot_processing',
          containerId: containerId
        })
      })
      
      if (!response.ok) {
        throw new Error('Không thể xác nhận hoàn tất xử lý tại depot')
      }
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message,
          variant: "success"
        })
        loadDashboardData() // Refresh data
        setShowDepotCompletion(false)
        setDepotCompletionContainer(null)
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error confirming depot completion:', error)
      toast({
          title: "Lỗi",
          description: error.message || "Không thể xác nhận hoàn tất xử lý tại depot",
          variant: "destructive"
        })
    }
  }

  const handleRequestReuse = (item: any) => {
    console.log('Requesting reuse for:', item)
    // TODO: Implement reuse request dialog
    toast({
      title: "Thành công",
      description: `Đang xử lý yêu cầu Re-use cho ${item.container_number || item.booking_number}`,
      variant: "success"
    })
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
          <LtaLoadingInline text="Đang tải dữ liệu..." />
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
      <div className="container mx-auto px-2 sm:px-4 min-h-[calc(100vh-64px)] flex flex-col gap-4 pt-4">
        {/* Phần trên: Header + Tabs + Add New Button - Luôn full width */}
        <div className="flex items-center gap-2 flex-wrap">
          <PageHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
            totalCount={activeTab === "dropoff" ? data.importContainers.length : data.exportBookings.length}
            title="Tất Cả Lệnh Giao Trả"
          />
          <div className="ml-auto w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCreateContainer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto font-medium"
              >
                <Plus className="w-4 h-4" />
                Tạo Lệnh Giao Trả
              </button>
              <button 
                onClick={() => setShowCreateBooking(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto font-medium"
              >
                <Plus className="w-4 h-4" />
                Tạo Lệnh Lấy Rỗng
              </button>
            </div>
          </div>
        </div>

        {/* Dialog Tạo Lệnh Giao Trả */}
        {showCreateContainer && (
          <CreateContainerDialog shippingLines={data.shippingLines} onSuccess={() => { setShowCreateContainer(false); loadDashboardData(); }} />
        )}
        {/* Dialog Tạo Lệnh Lấy Rỗng */}
        {showCreateBooking && (
          <CreateBookingDialog shippingLines={data.shippingLines} onSuccess={() => { setShowCreateBooking(false); loadDashboardData(); }} />
        )}

        {/* Dialog Thanh Toán COD */}
        <CodPaymentDialog 
          open={showCodPayment}
          onOpenChange={(open) => {
            setShowCodPayment(open)
            if (!open) {
              setPendingCodPayment(null)
            }
          }}
          payment={pendingCodPayment}
          onPaymentSuccess={() => {
            setShowCodPayment(false)
            setPendingCodPayment(null)
            loadDashboardData() // Refresh data after successful COD payment
            toast({
        title: "Thành công",
        description: 'Thanh toán phí COD thành công!',
        variant: "success"
      })
          }}
        />

        {/* Dialog Xác Nhận Hoàn Tất Depot */}
        <ConfirmDepotCompletionDialog
          open={showDepotCompletion}
          onOpenChange={(open) => {
            setShowDepotCompletion(open)
            if (!open) {
              setDepotCompletionContainer(null)
            }
          }}
          container={depotCompletionContainer}
          onConfirm={handleDepotCompletionConfirm}
        />

        {/* Bộ filter chi tiết - Luôn full width */}
        {activeTab === "dropoff" && (
          <div className="w-full">
            <ContainerFilters onFiltersChange={setContainerFilters} totalCount={filteredImportContainers.length} />
          </div>
        )}
        {activeTab === "pickup" && (
          <div className="w-full">
            <BookingFilters onFiltersChange={setBookingFilters} totalCount={filteredExportBookings.length} />
          </div>
        )}

        {/* Phần dưới: Content + Contextual Sidebar - flex-row trên xl */}
        <div className="flex flex-col xl:flex-row gap-4 flex-1">
          {/* Main Content (bảng/cards) - 2/3 width trên xl */}
          <div className="w-full xl:w-2/3 min-w-0 flex flex-col">
            <div className="h-auto flex flex-col min-w-0">
              {/* Tab Lệnh Giao Trả */}
              {activeTab === "dropoff" && (
                <div className="w-full min-w-0 overflow-x-auto">
                  <FullDropOffOrdersTable 
                    importContainers={paginatedImportContainers}
                    onViewDetails={handleViewDetails}
                    onRequestCod={handleRequestCod}
                    onPayCodFee={handlePayCodFee}
                    onConfirmCodDelivery={handleConfirmCodDelivery}
                    onConfirmDepotCompletion={handleConfirmDepotCompletion}
                    onRequestReuse={handleRequestReuse}
                  />
                </div>
              )}
              {/* Tab Lệnh Lấy Rỗng */}
              {activeTab === "pickup" && (
                <div className="w-full min-w-0 overflow-x-auto">
                  <FullPickupOrdersTable 
                    exportBookings={paginatedExportBookings}
                    onViewDetails={handleViewDetails}
                    onRequestReuse={handleRequestReuse}
                  />
                </div>
              )}
              {activeTab === "suggestions" && (
                <SuggestionLeaderboard 
                  suggestions={matchSuggestions}
                  importContainers={filteredImportContainers}
                  exportBookings={filteredExportBookings}
                />
              )}
            </div>
          </div>
          {/* Contextual Sidebar - chỉ xuất hiện song song với content, ẩn hoàn toàn trên mobile/tablet */}
          <div className="hidden xl:block xl:w-1/3 xl:min-w-[350px] h-[calc(100vh-200px)]">
            <ContextualSidebar
              importContainers={filteredImportContainers}
              exportBookings={filteredExportBookings}
              matchSuggestions={matchSuggestions}
            />
          </div>
        </div>

        {/* Pagination - Full width ngoài container content */}
        {(activeTab === "dropoff" || activeTab === "pickup") && (
          <div className="w-full">
            <Pagination 
              currentPage={activeTab === "dropoff" ? (containerFilters.page || 1) : (bookingFilters.page || 1)} 
              totalCount={activeTab === "dropoff" ? filteredImportContainers.length : filteredExportBookings.length} 
              pageSize={activeTab === "dropoff" ? (containerFilters.pageSize || 10) : (bookingFilters.pageSize || 10)} 
              onPageChange={page => {
                if (activeTab === "dropoff") {
                  setContainerFilters((f: any) => ({ ...f, page }))
                } else {
                  setBookingFilters((f: any) => ({ ...f, page }))
                }
              }} 
              onPageSizeChange={pageSize => {
                if (activeTab === "dropoff") {
                  setContainerFilters((f: any) => ({ ...f, pageSize, page: 1 }))
                } else {
                  setBookingFilters((f: any) => ({ ...f, pageSize, page: 1 }))
                }
              }} 
            />
          </div>
        )}

        {/* Detail Modal */}
        {selectedDetailItem && (
          <OrderDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedDetailItem(null)
            }}
            container={selectedDetailItem.container_type ? selectedDetailItem : undefined}
            booking={selectedDetailItem.booking_number ? selectedDetailItem : undefined}
            onRequestCod={handleRequestCod}
            onPayCodFee={handlePayCodFee}
            onConfirmCodDelivery={handleConfirmCodDelivery}
            onConfirmDepotCompletion={handleConfirmDepotCompletion}
            onRequestReuse={handleRequestReuse}
          />
        )}

        {/* COD Request Dialog */}
        {codRequestContainer && (
          <CodRequestDialog
            isOpen={showCodRequest}
            onClose={handleCloseCodRequest}
            container={codRequestContainer}
            onSuccess={handleCodRequestSuccess}
          />
        )}
      </div>
    </DispatcherDashboardWrapper>
  )
}