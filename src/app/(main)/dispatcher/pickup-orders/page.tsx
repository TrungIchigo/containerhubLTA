'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import ExportBookingsTable from '@/components/dispatcher/ExportBookingsTable'
import BookingFilters from '@/components/dispatcher/BookingFilters'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/common/Pagination'
import CreateBookingDialog from '@/components/features/dispatcher/CreateBookingDialog'
import { Loading } from '@/components/ui/loader'

export default function PickupOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentFilters, setCurrentFilters] = useState<any>({
    page: 1,
    pageSize: 20
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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
        router.push('/dashboard')
        return
      }

      // Load bookings
      const orgId = profile.organization_id
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

      const loadedData = {
        exportBookings: exportBookings || [],
        shippingLines: shippingLines || []
      }

      setData(loadedData)
      setFilteredBookings(loadedData.exportBookings)
      setTotalCount(loadedData.exportBookings.length)

    } catch (err: any) {
      console.error('Error loading pickup orders:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = async (filters: any) => {
    if (!data) return

    setCurrentFilters(filters)

    try {
      const supabase = createClient()
      let query = supabase
        .from('export_bookings')
        .select(`
          *,
          container_type:container_types(*)
        `)
        .eq('trucking_company_org_id', data.exportBookings[0]?.trucking_company_org_id)

      // Apply search filter
      if (filters.search) {
        query = query.or(`booking_number.ilike.%${filters.search}%,pick_up_location.ilike.%${filters.search}%`)
      }

      // Apply container type filter
      if (filters.containerTypeId && filters.containerTypeId !== 'all') {
        query = query.eq('container_type_id', filters.containerTypeId)
      }

      // Apply date range filter
      if (filters.fromDate) {
        query = query.gte('needed_by_datetime', filters.fromDate)
      }
      if (filters.toDate) {
        query = query.lte('needed_by_datetime', filters.toDate + 'T23:59:59')
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Apply sorting
      query = query.order(filters.sortBy || 'needed_by_datetime', { 
        ascending: filters.sortOrder === 'asc' 
      })

      // Get total count for pagination with same filters
      let countQuery = supabase
        .from('export_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('trucking_company_org_id', data.exportBookings[0]?.trucking_company_org_id)

      // Apply same filters to count
      if (filters.search) {
        countQuery = countQuery.or(`booking_number.ilike.%${filters.search}%,pick_up_location.ilike.%${filters.search}%`)
      }
      if (filters.containerTypeId && filters.containerTypeId !== 'all') {
        countQuery = countQuery.eq('container_type_id', filters.containerTypeId)
      }
      if (filters.fromDate) {
        countQuery = countQuery.gte('needed_by_datetime', filters.fromDate)
      }
      if (filters.toDate) {
        countQuery = countQuery.lte('needed_by_datetime', filters.toDate + 'T23:59:59')
      }
      if (filters.status && filters.status !== 'all') {
        countQuery = countQuery.eq('status', filters.status)
      }

      const { count } = await countQuery

      // Apply pagination
      const offset = (filters.page - 1) * filters.pageSize
      query = query.range(offset, offset + filters.pageSize - 1)

      const { data: filteredData, error } = await query

      if (error) throw error

      setFilteredBookings(filteredData || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error filtering bookings:', error)
    }
  }

  const handlePageChange = (page: number) => {
    handleFiltersChange({ ...currentFilters, page })
  }

  const handlePageSizeChange = (pageSize: number) => {
    handleFiltersChange({ ...currentFilters, pageSize, page: 1 })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading text="Đang tải danh sách lệnh lấy rỗng..." />
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
            Không thể tải danh sách lệnh lấy rỗng. Vui lòng thử lại sau.
          </p>
          <Button asChild>
            <Link href="/dispatcher">Quay lại Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DispatcherDashboardWrapper 
      userOrgId={data?.exportBookings[0]?.trucking_company_org_id || ''}
      shippingLines={data?.shippingLines || []}
    >
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dispatcher">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  Lệnh Lấy Rỗng Sắp Tới Hạn
                </h1>
                <p className="text-text-secondary">
                  Danh sách chi tiết tất cả lệnh lấy container rỗng ({filteredBookings.length} kết quả)
                </p>
              </div>
            </div>
            
            {/* Add Booking Button */}
            <CreateBookingDialog 
              shippingLines={data?.shippingLines || []} 
              onSuccess={loadData} 
            />
          </div>

          {/* Filters */}
          <BookingFilters
            onFiltersChange={handleFiltersChange}
            totalCount={totalCount}
          />

          {/* Content */}
          <ExportBookingsTable bookings={filteredBookings} />
          
          {/* Pagination */}
          <Pagination
            currentPage={currentFilters.page}
            totalCount={totalCount}
            pageSize={currentFilters.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </DispatcherDashboardWrapper>
  )
} 