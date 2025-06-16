'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { MapPin, Building2, Loader2 } from 'lucide-react'
import { useCities, useDepots } from '@/hooks/useLocations'

interface LocationSelectorProps {
  cityValue: string
  depotValue: string
  onCityChange: (cityId: string) => void
  onDepotChange: (depotId: string) => void
  cityError?: string
  depotError?: string
  required?: boolean
  cityLabel?: string
  depotLabel?: string
}

export default function LocationSelector({
  cityValue,
  depotValue,
  onCityChange,
  onDepotChange,
  cityError,
  depotError,
  required = true,
  cityLabel = "Thành phố",
  depotLabel = "Depot/Địa điểm"
}: LocationSelectorProps) {
  const { cities, loading: citiesLoading, error: citiesError } = useCities()
  const { depots, loading: depotsLoading, error: depotsError } = useDepots(cityValue || null)

  // Reset depot when city changes
  useEffect(() => {
    if (cityValue && depotValue) {
      // Check if current depot belongs to selected city
      const currentDepot = depots.find(d => d.value === depotValue)
      if (!currentDepot) {
        onDepotChange('')
      }
    }
  }, [cityValue, depots, depotValue, onDepotChange])

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCityId = e.target.value
    onCityChange(newCityId)
    // Reset depot when city changes
    onDepotChange('')
  }

  const handleDepotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDepotChange(e.target.value)
  }

  return (
    <div className="space-y-4">
      {/* City Selection */}
      <div className="space-y-2">
        <Label htmlFor="city_id" className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          {cityLabel}
          {required && ' *'}
        </Label>
        
        {citiesLoading ? (
          <div className="flex items-center justify-center py-3 border border-border rounded-md">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Đang tải danh sách thành phố...</span>
          </div>
        ) : citiesError ? (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {citiesError}
          </div>
        ) : (
          <select
            id="city_id"
            value={cityValue}
            onChange={handleCityChange}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            required={required}
          >
            <option value="">Chọn thành phố/tỉnh</option>
            {cities.map((city) => (
              <option key={city.value} value={city.value}>
                {city.isMajorCity ? '🏙️ ' : '🏘️ '}{city.label}
              </option>
            ))}
          </select>
        )}
        
        {cityError && (
          <p className="text-sm text-red-600">{cityError}</p>
        )}
      </div>

      {/* Depot Selection */}
      <div className="space-y-2">
        <Label htmlFor="depot_id" className="flex items-center">
          <Building2 className="w-4 h-4 mr-2" />
          {depotLabel}
          {required && ' *'}
        </Label>
        
        {!cityValue ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed">
            Vui lòng chọn thành phố trước
          </div>
        ) : depotsLoading ? (
          <div className="flex items-center justify-center py-3 border border-border rounded-md">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Đang tải danh sách depot...</span>
          </div>
        ) : depotsError ? (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {depotsError}
          </div>
        ) : (
          <select
            id="depot_id"
            value={depotValue}
            onChange={handleDepotChange}
            disabled={!cityValue || depotsLoading}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
            required={required}
          >
            <option value="">Chọn depot/địa điểm</option>
            {depots.map((depot) => (
              <option key={depot.value} value={depot.value} title={depot.address}>
                {depot.label}
                {depot.address && ` - ${depot.address}`}
              </option>
            ))}
          </select>
        )}
        
        {depotError && (
          <p className="text-sm text-red-600">{depotError}</p>
        )}
        
        {/* Depot count info */}
        {cityValue && !depotsLoading && !depotsError && (
          <p className="text-xs text-muted-foreground">
            {depots.length > 0 
              ? `${depots.length} depot có sẵn trong khu vực này`
              : 'Không có depot nào trong khu vực này'
            }
          </p>
        )}
      </div>
    </div>
  )
} 