'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export default function MarketplaceFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    container_type: searchParams.get('container_type') || '',
    shipping_line_name: searchParams.get('shipping_line_name') || '',
    location: searchParams.get('location') || '',
    max_distance_km: searchParams.get('max_distance_km') || ''
  })

  const containerTypes = [
    { value: '', label: 'Tất cả' },
    { value: '20FT', label: '20FT' },
    { value: '40FT', label: '40FT' },
    { value: '40HQ', label: '40HQ' },
    { value: '45FT', label: '45FT' }
  ]

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }))
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
      max_distance_km: ''
    })
    router.push('/marketplace')
  }

  const hasActiveFilters = Object.values(filters).some(value => value && value.trim() !== '')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Container Type */}
        <div className="space-y-2">
          <Label htmlFor="container_type">Loại Container</Label>
          <select
            id="container_type"
            value={filters.container_type}
            onChange={(e) => handleFilterChange('container_type', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {containerTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Shipping Line */}
        <div className="space-y-2">
          <Label htmlFor="shipping_line_name">Hãng Tàu</Label>
          <Input
            id="shipping_line_name"
            type="text"
            value={filters.shipping_line_name}
            onChange={(e) => handleFilterChange('shipping_line_name', e.target.value)}
            placeholder="Tên hãng tàu..."
            className="border-border focus:border-primary"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Địa điểm</Label>
          <Input
            id="location"
            type="text"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            placeholder="Tỉnh/thành phố..."
            className="border-border focus:border-primary"
          />
        </div>

        {/* Max Distance */}
        <div className="space-y-2">
          <Label htmlFor="max_distance_km">Khoảng cách tối đa (km)</Label>
          <Input
            id="max_distance_km"
            type="number"
            value={filters.max_distance_km}
            onChange={(e) => handleFilterChange('max_distance_km', e.target.value)}
            placeholder="50"
            min="1"
            max="500"
            className="border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={applyFilters}
          className="bg-primary hover:bg-primary-dark text-white"
        >
          <Search className="w-4 h-4 mr-2" />
          Tìm kiếm
        </Button>
        
        {hasActiveFilters && (
          <Button 
            onClick={clearFilters}
            variant="outline"
          >
            <X className="w-4 h-4 mr-2" />
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  )
} 