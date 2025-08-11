'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Building2, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAllDepots } from '@/hooks/useLocations'

interface DepotOnlySelectorProps {
  depotValue: string
  onDepotChange: (depotId: string, depotName?: string, depotData?: any) => void
  depotError?: string
  required?: boolean
  depotLabel?: string
  placeholder?: string
}

export default function DepotOnlySelector({
  depotValue,
  onDepotChange,
  depotError,
  required = true,
  depotLabel = "Depot/Địa điểm",
  placeholder = "Chọn depot/địa điểm..."
}: DepotOnlySelectorProps) {
  const { depots, loading: depotsLoading, error: depotsError } = useAllDepots()
  
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const selectedDepot = depots.find(depot => depot.value === depotValue)
  
  // Filter depots based on search
  const filteredDepots = depots.filter(depot => 
    depot.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    (depot.address && depot.address.toLowerCase().includes(searchValue.toLowerCase())) ||
    (depot.cityName && depot.cityName.toLowerCase().includes(searchValue.toLowerCase()))
  )

  // Group depots by city for better organization
  const groupedDepots = filteredDepots.reduce((acc, depot) => {
    const cityName = depot.cityName || 'Khác'
    if (!acc[cityName]) {
      acc[cityName] = []
    }
    acc[cityName].push(depot)
    return acc
  }, {} as Record<string, typeof filteredDepots>)

  // Sort cities: major cities first, then alphabetically
  const sortedCityNames = Object.keys(groupedDepots).sort((a, b) => {
    const aIsMajor = groupedDepots[a].some(d => d.isMajorCity)
    const bIsMajor = groupedDepots[b].some(d => d.isMajorCity)
    
    if (aIsMajor && !bIsMajor) return -1
    if (!aIsMajor && bIsMajor) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-2 max-w-full">
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
                    {selectedDepot.cityName && (
                      <span className="text-muted-foreground"> - {selectedDepot.cityName}</span>
                    )}
                    {selectedDepot.address && (
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {selectedDepot.address}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[600px] p-0" align="start" sideOffset={4}>
            <Command className="rounded-lg border border-border shadow-md" shouldFilter={false}>
              <div className="px-3 py-2 border-b border-border">
                <CommandInput 
                  placeholder="Tìm kiếm depot theo tên, địa chỉ hoặc thành phố..." 
                  className="h-9 border-0 focus:ring-0 focus:outline-none"
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2" style={{ scrollbarWidth: 'thin' }}>
                {filteredDepots.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {searchValue ? 'Không tìm thấy depot phù hợp.' : 'Không tìm thấy depot nào.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedCityNames.map((cityName) => (
                      <div key={cityName}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                          {groupedDepots[cityName][0]?.isMajorCity ? '🏙️' : '🏘️'} {cityName}
                        </div>
                        <div className="mt-1 space-y-1">
                          {groupedDepots[cityName].map((depot) => (
                            <div
                              key={depot.value}
                              onClick={() => {
                                onDepotChange(depot.value, depot.label, {
                                  address: depot.address,
                                  latitude: depot.latitude,
                                  longitude: depot.longitude,
                                  cityName: depot.cityName
                                })
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
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {depot.label}
                                </div>
                                {depot.address && (
                                  <div className="text-xs text-muted-foreground truncate mt-1">
                                    {depot.address}
                                  </div>
                                )}
                                {depot.latitude && depot.longitude && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    📍 {depot.latitude.toFixed(4)}, {depot.longitude.toFixed(4)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      
      {depotError && (
        <p className="text-sm text-red-600">{depotError}</p>
      )}
      
      {/* Depot count info */}
      {!depotsLoading && !depotsError && (
        <p className="text-xs text-muted-foreground">
          {depots.length > 0 
            ? `${depots.length} depot có sẵn trong hệ thống`
            : 'Không có depot nào trong hệ thống'
          }
        </p>
      )}
    </div>
  )
}