'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { MapPin, Building2, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCities, useDepots } from '@/hooks/useLocations'

interface DepotSelectorProps {
  cityValue: string
  depotValue: string
  onCityChange: (cityId: string, cityName?: string) => void
  onDepotChange: (depotId: string, depotName?: string) => void
  cityError?: string
  depotError?: string
  required?: boolean
  cityLabel?: string
  depotLabel?: string
}

export default function DepotSelector({
  cityValue,
  depotValue,
  onCityChange,
  onDepotChange,
  cityError,
  depotError,
  required = true,
  cityLabel = "Thành phố/Tỉnh",
  depotLabel = "Địa điểm"
}: DepotSelectorProps) {
  const { cities, loading: citiesLoading, error: citiesError } = useCities()
  const { depots, loading: depotsLoading, error: depotsError } = useDepots(cityValue || null)
  
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  // Reset depot when city changes
  useEffect(() => {
    if (cityValue && depotValue) {
      // Check if current depot belongs to selected city
      const currentDepot = depots.find(d => d.value === depotValue)
      if (!currentDepot) {
        onDepotChange('', '')
      }
    }
  }, [cityValue, depots, depotValue, onDepotChange])

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCityId = e.target.value
    const selectedCity = cities.find(city => city.value === newCityId)
    onCityChange(newCityId, selectedCity?.label)
    // Reset depot when city changes
    onDepotChange('', '')
  }

  const selectedDepot = depots.find(depot => depot.value === depotValue)
  
  // Filter depots based on search
  const filteredDepots = depots.filter(depot => 
    depot.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    (depot.address && depot.address.toLowerCase().includes(searchValue.toLowerCase()))
  )

  return (
    <div className="space-y-4 max-w-full">
      {/* City Selection */}
      <div className="space-y-2">
        <Label htmlFor="city_id" className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          {cityLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
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

      {/* Depot Selection with Combobox */}
      {cityValue && (
        <div className="space-y-2">
          <Label className="flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            {depotLabel}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {depotsLoading ? (
            <div className="flex items-center justify-center py-3 border border-border rounded-md">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Đang tải danh sách depot...</span>
            </div>
          ) : depotsError ? (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {depotsError}
            </div>
          ) : (
            <Popover open={open} onOpenChange={(newOpen) => {
              setOpen(newOpen)
              if (!newOpen) {
                setSearchValue('')
              }
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between h-auto min-h-[40px] px-3 py-2"
                >
                  <div className="flex-1 min-w-0 text-left">
                    {selectedDepot ? (
                      <div className="truncate">
                        <span className="font-medium">{selectedDepot.label}</span>
                        {selectedDepot.address && (
                          <span className="text-muted-foreground"> - {selectedDepot.address}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Chọn depot/địa điểm...</span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[500px] p-0" align="start" sideOffset={4}>
                <Command className="rounded-lg border border-border shadow-md" shouldFilter={false}>
                  <div className="px-3 py-2 border-b border-border">
                    <CommandInput 
                      placeholder="Tìm kiếm depot..." 
                      className="h-9 border-0 focus:ring-0 focus:outline-none"
                      value={searchValue}
                      onValueChange={setSearchValue}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                    {filteredDepots.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {searchValue ? 'Không tìm thấy depot phù hợp.' : 'Không tìm thấy depot nào.'}
                      </div>
                    ) : (
                      filteredDepots.map((depot) => (
                        <div
                          key={depot.value}
                          onClick={() => {
                            onDepotChange(depot.value, depot.label)
                            setOpen(false)
                          }}
                          className="flex items-start gap-2 px-2 py-3 rounded-md cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                        >
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4 text-primary",
                              depotValue === depot.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <span className="font-medium text-sm leading-tight text-text-primary">{depot.label}</span>
                            {depot.address && (
                              <span className="text-xs text-muted-foreground leading-tight break-words">
                                {depot.address}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {depotError && (
            <p className="text-sm text-red-600">{depotError}</p>
          )}
          
          {depots.length > 0 && (
            <p className="text-xs text-gray-500">
              {depots.length} depot có sẵn trong khu vực này
            </p>
          )}
        </div>
      )}
    </div>
  )
} 