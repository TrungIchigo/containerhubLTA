'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Search, X, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { VIETNAM_PROVINCES, DISTANCE_OPTIONS, RATING_FILTER_OPTIONS } from '@/lib/constants'
import type { Organization } from '@/lib/types'

interface MarketplaceFiltersProps {
  shippingLines: Organization[]
}

export default function MarketplaceFilters({ shippingLines }: MarketplaceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    container_type: searchParams.get('container_type') || '',
    shipping_line_name: searchParams.get('shipping_line_name') || '',
    location: searchParams.get('location') || '',
    max_distance_km: searchParams.get('max_distance_km') || '',
    min_rating: searchParams.get('min_rating') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || ''
  })

  // Helper function to get display value for Select components
  const getSelectDisplayValue = (filterValue: string, type: 'container_type' | 'max_distance_km' | 'min_rating' | 'shipping_line' | 'location') => {
    if (!filterValue || filterValue.trim() === '') {
      // Return special values for display
      switch (type) {
        case 'max_distance_km':
          return 'unlimited'
        case 'min_rating':
          return 'all'
        default:
          return undefined
      }
    }
    return filterValue
  }

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (filters.start_date && filters.end_date) {
      return {
        from: new Date(filters.start_date),
        to: new Date(filters.end_date)
      }
    }
    return undefined
  })

  const containerTypes = [
    { value: '20FT', label: '20FT' },
    { value: '40FT', label: '40FT' },
    { value: '40HQ', label: '40HQ' },
    { value: '45FT', label: '45FT' }
  ]

  // Prepare shipping lines options for Select
  const shippingLineOptions = [
    ...shippingLines.map(line => ({ value: line.name, label: line.name }))
  ]

  // Prepare location options for Select
  const locationOptions = [
    ...VIETNAM_PROVINCES.map(province => ({ value: province.value, label: province.label }))
  ]

  const handleFilterChange = (name: string, value: string) => {
    // Convert special values back to empty string for backend processing
    const processedValue = (value === 'all' || value === 'unlimited') ? '' : value
    setFilters(prev => ({ ...prev, [name]: processedValue }))
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      setFilters(prev => ({
        ...prev,
        start_date: format(range.from!, 'yyyy-MM-dd'),
        end_date: format(range.to!, 'yyyy-MM-dd')
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        start_date: '',
        end_date: ''
      }))
    }
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        params.set(key, value.trim())
      }
    })

    const queryString = params.toString()
    const newUrl = queryString ? `/marketplace?${queryString}` : '/marketplace'
    
    router.push(newUrl)
  }

  const clearFilters = () => {
    setFilters({
      container_type: '',
      shipping_line_name: '',
      location: '',
      max_distance_km: '',
      min_rating: '',
      start_date: '',
      end_date: ''
    })
    setDateRange(undefined)
    router.push('/marketplace')
  }

  const hasActiveFilters = Object.values(filters).some(value => value && value.trim() !== '')

  return (
    <div className="space-y-6">
      {/* Main filters grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Container Type */}
        <div className="space-y-2">
          <Label htmlFor="container_type" className="text-sm font-medium text-gray-700">
            Loại Container
          </Label>
          <Select
            value={getSelectDisplayValue(filters.container_type, 'container_type')}
            onValueChange={(value: string) => handleFilterChange('container_type', value)}
          >
            <SelectTrigger className="h-10 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Chọn loại container" />
            </SelectTrigger>
            <SelectContent>
              {containerTypes.map((type) => (
                <SelectItem 
                  key={type.value} 
                  value={type.value}
                  className="hover:bg-green-50 focus:bg-green-50"
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shipping Line Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Hãng Tàu</Label>
          <Select
            value={getSelectDisplayValue(filters.shipping_line_name, 'shipping_line')}
            onValueChange={(value: string) => handleFilterChange('shipping_line_name', value)}
          >
            <SelectTrigger className="h-10 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Chọn hãng tàu" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {shippingLineOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="hover:bg-green-50 focus:bg-green-50"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Địa điểm</Label>
          <Select
            value={getSelectDisplayValue(filters.location, 'location')}
            onValueChange={(value: string) => handleFilterChange('location', value)}
          >
            <SelectTrigger className="h-10 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Chọn tỉnh/thành" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {locationOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="hover:bg-green-50 focus:bg-green-50"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Max Distance Select */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Khoảng cách tối đa</Label>
          <Select
            value={getSelectDisplayValue(filters.max_distance_km, 'max_distance_km')}
            onValueChange={(value: string) => handleFilterChange('max_distance_km', value)}
          >
            <SelectTrigger className="h-10 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Chọn khoảng cách" />
            </SelectTrigger>
            <SelectContent>
              {DISTANCE_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="hover:bg-green-50 focus:bg-green-50"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Secondary filters row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Partner Rating Filter - Smaller width */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Đánh giá đối tác</Label>
          <Select
            value={getSelectDisplayValue(filters.min_rating, 'min_rating')}
            onValueChange={(value: string) => handleFilterChange('min_rating', value)}
          >
            <SelectTrigger className="h-10 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Chọn mức đánh giá" />
            </SelectTrigger>
            <SelectContent>
              {RATING_FILTER_OPTIONS.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="hover:bg-green-50 focus:bg-green-50"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter - Simple date inputs */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Từ ngày</Label>
          <Input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            className="h-10 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Đến ngày</Label>
          <Input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            className="h-10 border-gray-200 hover:border-green-400 focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button 
          onClick={applyFilters}
          className="h-10 bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
        >
          <Search className="w-4 h-4 mr-2" />
          Tìm kiếm
        </Button>
        
        {hasActiveFilters && (
          <Button 
            onClick={clearFilters}
            variant="outline"
            className="h-10 border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700"
          >
            <X className="w-4 h-4 mr-2" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  )
} 