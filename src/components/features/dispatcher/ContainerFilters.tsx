'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { ContainerType, Organization } from '@/lib/types'

interface ContainerFiltersProps {
  containerTypes: ContainerType[]
  shippingLines: Organization[]
  onFilter: (filters: ContainerFilterOptions) => void
}

export interface ContainerFilterOptions {
  containerTypeId?: string
  shippingLineId?: string
  availableFromDate?: string
  searchQuery?: string
}

export default function ContainerFilters({ 
  containerTypes, 
  shippingLines, 
  onFilter 
}: ContainerFiltersProps) {
  const [filters, setFilters] = useState<ContainerFilterOptions>({})

  const updateFilter = (key: keyof ContainerFilterOptions, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined
    }
    setFilters(newFilters)
    onFilter(newFilters)
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Loại Container
            </label>
            <select 
              className="w-full p-2 border border-border rounded-md bg-white text-sm"
              value={filters.containerTypeId || ''}
              onChange={(e) => updateFilter('containerTypeId', e.target.value)}
            >
              <option value="">Tất cả loại</option>
              {containerTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.code} - {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Hãng Tàu
            </label>
            <select 
              className="w-full p-2 border border-border rounded-md bg-white text-sm"
              value={filters.shippingLineId || ''}
              onChange={(e) => updateFilter('shippingLineId', e.target.value)}
            >
              <option value="">Tất cả hãng tàu</option>
              {shippingLines.map(line => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Thời gian rảnh từ
            </label>
            <input 
              type="date" 
              className="w-full p-2 border border-border rounded-md bg-white text-sm"
              value={filters.availableFromDate || ''}
              onChange={(e) => updateFilter('availableFromDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-text-primary mb-2 block">
              Tìm kiếm
            </label>
            <input 
              type="text" 
              placeholder="Số container, địa điểm..."
              className="w-full p-2 border border-border rounded-md bg-white text-sm"
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 