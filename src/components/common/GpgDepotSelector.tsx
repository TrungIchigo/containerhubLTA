'use client'

import React, { forwardRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Building2, Loader2 } from 'lucide-react'
import { useGpgDepots } from '@/hooks/useLocations'
import type { DepotOption } from '@/lib/types/location'

interface GpgDepotSelectorProps {
  originDepotId?: string
  depotValue?: string
  onDepotChange?: (depotId: string, depotName?: string) => void
  depotError?: string
  required?: boolean
  depotLabel?: string
  className?: string
}

const GpgDepotSelector = forwardRef<HTMLButtonElement, GpgDepotSelectorProps>(
  ({ 
    originDepotId, 
    depotValue, 
    onDepotChange, 
    depotError, 
    required = false, 
    depotLabel = "Depot GPG",
    className 
  }, ref) => {
    const { depots, loading, error } = useGpgDepots(originDepotId)

    const handleValueChange = (value: string) => {
      const selectedDepot = depots.find((depot: DepotOption) => depot.value === value)
      onDepotChange?.(value, selectedDepot?.label)
    }

    return (
      <div className="space-y-2">
        {depotLabel && (
          <Label className="flex items-center text-sm font-medium">
            <Building2 className="w-4 h-4 mr-2" />
            {depotLabel}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}

        <Select
          value={depotValue} 
          onValueChange={handleValueChange}
          disabled={loading}
        >
          <SelectTrigger 
            ref={ref}
            className={`w-full ${depotError ? 'border-red-500' : ''} ${className}`}
          >
            <SelectValue placeholder={
              loading 
                ? "Đang tải depot GPG..." 
                : "Chọn depot GPG mới"
            } />
          </SelectTrigger>
          
          <SelectContent 
            position="popper"
            className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)] max-h-[300px] overflow-hidden"
          >
            <div className="max-h-[280px] overflow-y-auto">
              {loading ? (
                <SelectItem value="loading" disabled>
                  <div className="flex items-center gap-2 w-full">
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span className="truncate">Đang tải...</span>
                  </div>
                </SelectItem>
              ) : error ? (
                <SelectItem value="error" disabled>
                  <div className="text-red-500 text-sm py-2">
                    {error}
                  </div>
                </SelectItem>
              ) : depots.length === 0 ? (
                <SelectItem value="empty" disabled>
                  <div className="text-muted-foreground text-sm py-2">
                    Không có depot GPG nào
                  </div>
                </SelectItem>
              ) : (
                depots.map((depot: DepotOption) => (
                  <SelectItem 
                    key={depot.value} 
                    value={depot.value}
                    className="truncate"
                  >
                    {depot.label}
                  </SelectItem>
                ))
              )}
            </div>
          </SelectContent>
        </Select>

        {depotError && (
          <p className="text-sm text-red-500">{depotError}</p>
        )}

        {!loading && !error && depots.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {depots.length} depot GPG có thể chuyển đến
          </p>
        )}
      </div>
    )
  }
)

GpgDepotSelector.displayName = 'GpgDepotSelector'

export default GpgDepotSelector 