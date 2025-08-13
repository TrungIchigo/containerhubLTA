'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, ArrowUpDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FilterState {
  containerTypeId: string
  shippingLineId: string
  fromDate: string
  toDate: string
  statuses: string[] // Changed to array for multiple selection
  sortBy: string
  sortOrder: 'asc' | 'desc'
  page: number
  pageSize: number
}

interface BookingFiltersProps {
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

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Lệnh mới tạo', color: 'bg-green-100 text-green-800' },
  { value: 'AWAITING_REUSE_APPROVAL', label: 'Chờ duyệt Re-use', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ON_GOING_REUSE', label: 'Đã ghép', color: 'bg-blue-100 text-blue-800' },
]

export default function BookingFilters({ 
  onFiltersChange,
  totalCount
}: BookingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    containerTypeId: 'all',
    shippingLineId: 'all',
    fromDate: '',
    toDate: '',
    statuses: [], // Empty array means all statuses
    sortBy: 'needed_by_datetime',
    sortOrder: 'asc', // For booking deadlines, ascending (earliest first) makes more sense
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

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page when filters change (except when changing page/pageSize)
      page: key === 'page' || key === 'pageSize' ? prev.page : 1
    }))
  }

  const toggleStatus = (status: string) => {
    setFilters(prev => {
      const newStatuses = prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
      
      return {
        ...prev,
        statuses: newStatuses,
        page: 1
      }
    })
  }

  const clearFilters = () => {
    setFilters({
      containerTypeId: 'all',
      shippingLineId: 'all',
      fromDate: '',
      toDate: '',
      statuses: [],
      sortBy: 'needed_by_datetime',
      sortOrder: 'asc',
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
      // Different field, set new field with asc order (earliest deadlines first)
      setFilters(prev => ({
        ...prev,
        sortBy: field,
        sortOrder: 'asc'
      }))
    }
  }

  const hasActiveFilters = Boolean(
    (filters.containerTypeId && filters.containerTypeId !== 'all') || 
    (filters.shippingLineId && filters.shippingLineId !== 'all') || 
    filters.fromDate || 
    filters.toDate || 
    filters.statuses.length > 0
  )

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
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
        {/* Main Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {/* Container Type */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block break-words">
              Loại container
            </label>
            <Select value={filters.containerTypeId || undefined} onValueChange={(value) => updateFilter('containerTypeId', value || '')}>
              <SelectTrigger className="w-full">
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
            <label className="text-sm font-medium text-text-primary mb-2 block break-words">
              Hãng tàu
            </label>
            <Select value={filters.shippingLineId || undefined} onValueChange={(value) => updateFilter('shippingLineId', value || '')}>
              <SelectTrigger className="w-full">
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
            <label className="text-sm font-medium text-text-primary mb-2 block break-words">
              Từ ngày
            </label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => updateFilter('fromDate', e.target.value)}
              className="w-full"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block break-words">
              Đến ngày
            </label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => updateFilter('toDate', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Sort and Clear Filters */}
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block break-words">
                Sắp xếp theo hạn
              </label>
              <Button
                variant="outline"
                onClick={() => toggleSort('needed_by_datetime')}
                className="w-full justify-between"
              >
                {filters.sortOrder === 'asc' ? 'Gần hạn nhất' : 'Xa hạn nhất'}
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 text-xs"
              >
                <X className="w-3 h-3" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter Checkboxes */}
        <div className="border-t pt-4">
          <label className="text-sm font-medium text-text-primary mb-3 block">
            Lọc theo trạng thái
          </label>
          <div className="flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((status) => (
              <div key={status.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status.value}`}
                  checked={filters.statuses.includes(status.value)}
                  onCheckedChange={() => toggleStatus(status.value)}
                />
                <label
                  htmlFor={`status-${status.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <Badge variant="outline" className={status.color}>
                    {status.label}
                  </Badge>
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}