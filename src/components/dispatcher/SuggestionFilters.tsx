'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, DollarSign, Leaf } from 'lucide-react'

interface FilterState {
  search: string
  containerType: string
  shippingLine: string
  minSaving: string
  sortBy: string
}

interface SuggestionFiltersProps {
  onFiltersChange: (filters: FilterState) => void
  shippingLines: any[]
  containerTypes?: string[]
}

export default function SuggestionFilters({ 
  onFiltersChange, 
  shippingLines,
  containerTypes = ['20DC', '20DV', '20OT', '40DC', '40DV', '40HC', '40OT', '45HC']
}: SuggestionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    containerType: '',
    shippingLine: '',
    minSaving: '',
    sortBy: 'cost_saving_desc'
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      containerType: '',
      shippingLine: '',
      minSaving: '',
      sortBy: 'cost_saving_desc'
    }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = Object.values(filters).some((value, index) => {
    // Don't consider sortBy as an "active filter" for the clear button
    if (index === 4) return false // sortBy is the 5th item (index 4)
    return value !== ''
  })

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Basic Search and Sort */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
            <Input
              placeholder="Tìm kiếm container, booking..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="min-w-[200px]">
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cost_saving_desc">Tiết kiệm cao nhất</SelectItem>
                <SelectItem value="cost_saving_asc">Tiết kiệm thấp nhất</SelectItem>
                <SelectItem value="co2_saving_desc">Giảm CO₂ cao nhất</SelectItem>
                <SelectItem value="co2_saving_asc">Giảm CO₂ thấp nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="flex items-center gap-2 text-text-secondary"
            >
              <X className="w-4 h-4" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Loại container
              </label>
              <Select value={filters.containerType} onValueChange={(value) => updateFilter('containerType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả loại</SelectItem>
                  {containerTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Hãng tàu
              </label>
              <Select value={filters.shippingLine} onValueChange={(value) => updateFilter('shippingLine', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả hãng tàu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả hãng tàu</SelectItem>
                  {shippingLines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">
                Tiết kiệm tối thiểu
              </label>
              <Select value={filters.minSaving} onValueChange={(value) => updateFilter('minSaving', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="100">≥ $100</SelectItem>
                  <SelectItem value="200">≥ $200</SelectItem>
                  <SelectItem value="300">≥ $300</SelectItem>
                  <SelectItem value="500">≥ $500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Tìm kiếm: "{filters.search}"
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('search', '')}
                />
              </Badge>
            )}
            {filters.containerType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Loại: {filters.containerType}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('containerType', '')}
                />
              </Badge>
            )}
            {filters.shippingLine && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Hãng tàu: {shippingLines.find(l => l.id === filters.shippingLine)?.name}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('shippingLine', '')}
                />
              </Badge>
            )}
            {filters.minSaving && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Tối thiểu: ${filters.minSaving}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('minSaving', '')}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 