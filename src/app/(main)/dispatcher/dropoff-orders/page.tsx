'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import ImportContainersTable from '@/components/dispatcher/ImportContainersTable'
import ContainerFilters from '@/components/dispatcher/ContainerFilters'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/common/Pagination'
import CreateContainerDialog from '@/components/features/dispatcher/CreateContainerDialog'
import { Loading } from '@/components/ui/loader'

export default function DropoffOrdersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [filteredContainers, setFilteredContainers] = useState<any[]>([])
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

      // Load containers
      const orgId = profile.organization_id
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

      // Get shipping lines
      const { data: shippingLines } = await supabase
        .from('organizations')
        .select('*')
        .eq('type', 'SHIPPING_LINE')
        .order('name')

      const loadedData = {
        importContainers: importContainers || [],
        shippingLines: shippingLines || []
      }

      setData(loadedData)
      setFilteredContainers(loadedData.importContainers)
      setTotalCount(loadedData.importContainers.length)

    } catch (err: any) {
      console.error('Error loading dropoff orders:', err)
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
        .from('import_containers')
        .select(`
          *,
          shipping_line:organizations!import_containers_shipping_line_org_id_fkey(*),
          trucking_company:organizations!import_containers_trucking_company_org_id_fkey(*),
          container_type:container_types(*)
        `)
        .eq('trucking_company_org_id', data.importContainers[0]?.trucking_company_org_id)

      // Apply search filter
      if (filters.search) {
        query = query.or(`container_number.ilike.%${filters.search}%,drop_off_location.ilike.%${filters.search}%`)
      }

      // Apply container type filter
      if (filters.containerTypeId && filters.containerTypeId !== 'all') {
        query = query.eq('container_type_id', filters.containerTypeId)
      }

      // Apply shipping line filter
      if (filters.shippingLineId && filters.shippingLineId !== 'all') {
        query = query.eq('shipping_line_org_id', filters.shippingLineId)
      }

      // Apply date range filter
      if (filters.fromDate) {
        query = query.gte('available_from_datetime', filters.fromDate)
      }
      if (filters.toDate) {
        query = query.lte('available_from_datetime', filters.toDate + 'T23:59:59')
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      // Apply sorting
      query = query.order(filters.sortBy || 'available_from_datetime', { 
        ascending: filters.sortOrder === 'asc' 
      })

      // Get total count for pagination with same filters
      let countQuery = supabase
        .from('import_containers')
        .select('*', { count: 'exact', head: true })
        .eq('trucking_company_org_id', data.importContainers[0]?.trucking_company_org_id)

      // Apply same filters to count
      if (filters.search) {
        countQuery = countQuery.or(`container_number.ilike.%${filters.search}%,drop_off_location.ilike.%${filters.search}%`)
      }
      if (filters.containerTypeId && filters.containerTypeId !== 'all') {
        countQuery = countQuery.eq('container_type_id', filters.containerTypeId)
      }
      if (filters.shippingLineId && filters.shippingLineId !== 'all') {
        countQuery = countQuery.eq('shipping_line_org_id', filters.shippingLineId)
      }
      if (filters.fromDate) {
        countQuery = countQuery.gte('available_from_datetime', filters.fromDate)
      }
      if (filters.toDate) {
        countQuery = countQuery.lte('available_from_datetime', filters.toDate + 'T23:59:59')
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

      setFilteredContainers(filteredData || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error filtering containers:', error)
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
        <Loading text="Đang tải danh sách lệnh trả rỗng..." />
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
            Không thể tải danh sách lệnh giao trả. Vui lòng thử lại sau.
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
      userOrgId={data?.importContainers[0]?.trucking_company_org_id || ''}
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
                  Lệnh Giao Trả Sắp Tới
                </h1>
                <p className="text-text-secondary">
                  Danh sách chi tiết tất cả lệnh giao trả container ({filteredContainers.length} kết quả)
                </p>
              </div>
            </div>
            
            {/* Add Container Button */}
            <CreateContainerDialog 
              shippingLines={data?.shippingLines || []} 
              onSuccess={loadData} 
            />
          </div>

          {/* Filters */}
          <ContainerFilters
            onFiltersChange={handleFiltersChange}
            totalCount={totalCount}
          />

          {/* Content */}
          <ImportContainersTable
            containers={filteredContainers}
            shippingLines={data?.shippingLines || []}
          />
          
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