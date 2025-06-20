'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { MapPin, Building2, Loader2, PenTool } from 'lucide-react'
import { useCities, useDepots } from '@/hooks/useLocations'

interface FlexibleLocationSelectorProps {
  cityValue: string
  locationValue: string // This will store either depot_id or custom address
  locationType: 'depot' | 'custom' // Track which type is selected
  onCityChange: (cityId: string) => void
  onLocationChange: (value: string, type: 'depot' | 'custom') => void
  cityError?: string
  locationError?: string
  required?: boolean
  cityLabel?: string
  locationLabel?: string
  customLocationPlaceholder?: string
  maxLength?: number
}

export default function FlexibleLocationSelector({
  cityValue,
  locationValue,
  locationType,
  onCityChange,
  onLocationChange,
  cityError,
  locationError,
  required = true,
  cityLabel = "Thành phố",
  locationLabel = "Địa điểm",
  customLocationPlaceholder = "Nhập địa chỉ cụ thể...",
  maxLength = 255
}: FlexibleLocationSelectorProps) {
  const { cities, loading: citiesLoading, error: citiesError } = useCities()
  const { depots, loading: depotsLoading, error: depotsError } = useDepots(cityValue || null)
  
  const [inputMode, setInputMode] = useState<'dropdown' | 'custom'>(
    locationType === 'custom' ? 'custom' : 'dropdown'
  )

  // Reset location when city changes
  useEffect(() => {
    if (cityValue && locationValue && locationType === 'depot') {
      // Check if current depot belongs to selected city
      const currentDepot = depots.find(d => d.value === locationValue)
      if (!currentDepot) {
        onLocationChange('', 'depot')
      }
    }
  }, [cityValue, depots, locationValue, locationType, onLocationChange])

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCityId = e.target.value
    onCityChange(newCityId)
    // Reset location when city changes
    onLocationChange('', locationType)
  }

  const handleInputModeChange = (mode: 'dropdown' | 'custom') => {
    setInputMode(mode)
    // Clear current value when switching modes
    onLocationChange('', mode === 'custom' ? 'custom' : 'depot')
  }

  const handleDepotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onLocationChange(e.target.value, 'depot')
  }

  const handleCustomLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLocationChange(e.target.value, 'custom')
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

      {/* Location Input Mode Selection */}
      {cityValue && (
        <div className="space-y-3">
          {/* Mode Toggle Buttons */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleInputModeChange('dropdown')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'dropdown'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Chọn từ danh sách
            </button>
            <button
              type="button"
              onClick={() => handleInputModeChange('custom')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'custom'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Nhập địa chỉ
            </button>
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <Label className="flex items-center">
              {inputMode === 'dropdown' ? (
                <Building2 className="w-4 h-4 mr-2" />
              ) : (
                <PenTool className="w-4 h-4 mr-2" />
              )}
              {locationLabel}
              {required && ' *'}
            </Label>

            {inputMode === 'dropdown' ? (
              // Dropdown Mode
              depotsLoading ? (
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
                  value={locationType === 'depot' ? locationValue : ''}
                  onChange={handleDepotChange}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
              )
            ) : (
              // Custom Input Mode
              <div className="space-y-1">
                <Input
                  value={locationType === 'custom' ? locationValue : ''}
                  onChange={handleCustomLocationChange}
                  placeholder={customLocationPlaceholder}
                  maxLength={maxLength}
                  className="border-border focus:border-primary"
                  required={required}
                />
                <p className="text-xs text-gray-500">
                  {locationType === 'custom' ? locationValue.length : 0}/{maxLength} ký tự
                </p>
              </div>
            )}

            {locationError && (
              <p className="text-sm text-red-600">{locationError}</p>
            )}

            {/* Info text */}
            {inputMode === 'dropdown' && !depotsLoading && !depotsError && (
              <p className="text-xs text-muted-foreground">
                {depots.length > 0 
                  ? `${depots.length} depot có sẵn trong khu vực này`
                  : 'Không có depot nào trong khu vực này - hãy thử chế độ nhập địa chỉ'
                }
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 