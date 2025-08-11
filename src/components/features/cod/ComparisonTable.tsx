'use client'

import { MapPin, DollarSign, Route } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DepotWithFee {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  fee: number
  distance_km: number
}

interface ComparisonTableProps {
  originalDepotId: string
  depotsWithFees: DepotWithFee[]
  selectedDepotId: string | null
  hoveredDepotId: string | null
  onDepotSelect: (depotId: string) => void
  onDepotHover: (depotId: string | null) => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`
}

export default function ComparisonTable({
  originalDepotId,
  depotsWithFees,
  selectedDepotId,
  hoveredDepotId,
  onDepotSelect,
  onDepotHover
}: ComparisonTableProps) {
  if (depotsWithFees.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>Không có depot GPG khả dụng</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {depotsWithFees.map((depot, index) => {
        const isSelected = selectedDepotId === depot.id
        const isHovered = hoveredDepotId === depot.id
        const isLowestFee = index === 0 && depot.fee > 0
        
        return (
          <div
            key={depot.id}
            className={cn(
              "p-4 cursor-pointer transition-all duration-200 hover:bg-blue-50",
              isSelected && "bg-blue-100 border-l-4 border-l-blue-500",
              isHovered && !isSelected && "bg-gray-50"
            )}
            onClick={() => onDepotSelect(depot.id)}
            onMouseEnter={() => onDepotHover(depot.id)}
            onMouseLeave={() => onDepotHover(null)}
          >
            {/* Header với tên depot và badge */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-medium text-sm leading-tight",
                  isSelected ? "text-blue-900" : "text-gray-900"
                )}>
                  {depot.name}
                </h3>
                {isLowestFee && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    Phí thấp nhất
                  </span>
                )}
              </div>
              {isSelected && (
                <div className="ml-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Địa chỉ */}
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed">
                {depot.address}
              </p>
            </div>

            {/* Thông tin phí và khoảng cách */}
            <div className="grid grid-cols-2 gap-3">
              {/* Phí COD */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-3 w-3 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Phí COD</p>
                  <p className={cn(
                    "text-sm font-semibold",
                    depot.fee === 0 ? "text-green-600" : "text-gray-900"
                  )}>
                    {depot.fee === 0 ? "Miễn phí" : formatCurrency(depot.fee)}
                  </p>
                </div>
              </div>

              {/* Khoảng cách */}
              <div className="flex items-center gap-2">
                <Route className="h-3 w-3 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Khoảng cách</p>
                  <p className="text-sm font-medium text-gray-900">
                    {depot.distance_km > 0 ? formatDistance(depot.distance_km) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action hint */}
            {!isSelected && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Nhấp để chọn depot này
                </p>
              </div>
            )}

            {isSelected && (
              <div className="mt-3 pt-2 border-t border-blue-200">
                <p className="text-xs text-blue-600 text-center font-medium">
                  ✓ Đã chọn depot này
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Footer thông tin */}
      <div className="p-4 bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          Tổng cộng <span className="font-medium">{depotsWithFees.length}</span> depot GPG khả dụng
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Sắp xếp theo phí COD từ thấp đến cao
        </p>
      </div>
    </div>
  )
}