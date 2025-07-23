'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, X, ArrowUpDown, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FilterState {
  search: string
  containerTypeId: string
  shippingLineId: string
  fromDate: string
  toDate: string
  status: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}

interface ContainerFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  totalCount: number
}

interface ContainerType {
  id: string
  code: string
  name: string
}

interface ShippingLine {
  id: string
  name: string
}

export default function ContainerFilters({ 
  onFiltersChange,
  totalCount
}: ContainerFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    containerTypeId: 'all',
    shippingLineId: 'all',
    fromDate: '',
    toDate: '',
    status: 'all',
    sortBy: 'available_from_datetime',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20
  })

  const [containerTypes, setContainerTypes] = useState<ContainerType[]>([])
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([])
  const [loading, setLoading] = useState(true)

  // Load container types and shipping lines
  useEffect(() => {
    loadData()
  }, [])

  // Trigger filter changes
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const loadData = async () => {
    try {
      const supabase = createClient()
      
      // Load container types
      const { data: containerTypesData } = await supabase
        .from('container_types')
        .select('id, code, name')
        .order('code')

      // Load shipping lines
      const { data: shippingLinesData } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('type', 'SHIPPING_LINE')
        .order('name')

      setContainerTypes(containerTypesData || [])
      setShippingLines(shippingLinesData || [])
    } catch (error) {
      console.error('Error loading filter data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page when filters change (except when changing page/pageSize)
      page: key === 'page' || key === 'pageSize' ? prev.page : 1
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      containerTypeId: 'all',
      shippingLineId: 'all',
      fromDate: '',
      toDate: '',
      status: 'all',
      sortBy: 'available_from_datetime',
      sortOrder: 'desc',
      page: 1,
      pageSize: filters.pageSize // Keep page size
    })
  }

  const toggleSort = (field: string) => {
    if (filters.sortBy === field) {
      // Same field, toggle order
      setFilters(prev => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
      }))
    } else {
      // Different field, set new field with desc order
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: 'desc'
      }))
    }
  }

  const hasActiveFilters = Boolean(
    filters.search || 
    (filters.containerTypeId && filters.containerTypeId !== 'all') || 
    (filters.shippingLineId && filters.shippingLineId !== 'all') || 
    filters.fromDate || 
    filters.toDate || 
    (filters.status && filters.status !== 'all')
  )

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / filters.pageSize)
  const startItem = (filters.page - 1) * filters.pageSize + 1
  const endItem = Math.min(filters.page * filters.pageSize, totalCount)

  const pageSizeOptions = [10, 20, 30, 50]

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-4 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        {/* Search and Clear */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
            <Input
              placeholder="Tìm kiếm số container, địa điểm..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Container Type */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Loại container
            </label>
            <Select value={filters.containerTypeId || undefined} onValueChange={(value) => updateFilter('containerTypeId', value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {containerTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.code} - {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shipping Line */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Hãng tàu
            </label>
            <Select value={filters.shippingLineId || undefined} onValueChange={(value) => updateFilter('shippingLineId', value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả hãng tàu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hãng tàu</SelectItem>
                {shippingLines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* From Date */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Từ ngày
            </label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => updateFilter('fromDate', e.target.value)}
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Đến ngày
            </label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => updateFilter('toDate', e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Trạng thái
            </label>
            <Select value={filters.status || undefined} onValueChange={(value) => updateFilter('status', value || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
                <SelectItem value="AWAITING_REUSE_APPROVAL">Chờ duyệt tái sử dụng</SelectItem>
                <SelectItem value="AWAITING_COD_APPROVAL">Chờ duyệt COD</SelectItem>
                <SelectItem value="AWAITING_COD_PAYMENT">Chờ thanh toán phí COD</SelectItem>
                <SelectItem value="AWAITING_REUSE_PAYMENT">Chờ thanh toán phí tái sử dụng</SelectItem>
                <SelectItem value="ON_GOING_COD">Đã thanh toán - Đang thực hiện COD</SelectItem>
                <SelectItem value="ON_GOING_REUSE">Đã thanh toán - Đang thực hiện Tái sử dụng</SelectItem>
                <SelectItem value="PROCESSING">Đang xử lý tại Depot</SelectItem>
                <SelectItem value="COMPLETED">Hoàn tất</SelectItem>
                <SelectItem value="COD_REJECTED">Bị từ chối COD</SelectItem>
                <SelectItem value="REUSE_REJECTED">Bị từ chối tái sử dụng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Sắp xếp theo ngày rảnh
            </label>
            <Button
              variant="outline"
              onClick={() => toggleSort('available_from_datetime')}
              className="w-full justify-between"
            >
              {filters.sortOrder === 'desc' ? 'Giảm dần' : 'Tăng dần'}
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
        </div>


      </CardContent>
    </Card>
  )
} 