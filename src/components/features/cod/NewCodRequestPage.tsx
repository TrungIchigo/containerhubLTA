'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ComparisonTable from './ComparisonTable'
import ActionSummaryBar from '@/components/features/cod/ActionSummaryBar'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import MapErrorBoundary from '@/components/ui/map-error-boundary'

const CodMap = dynamic(() => import('@/components/features/cod/CodMap'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
})

interface OriginalOrder {
  id: string
  container_number: string
  container_type: string
  drop_off_location: string
  depot_id: string
  available_from_datetime: string
  trucking_company_org_id: string
  shipping_line_org_id: string
  depot: {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
  }
}

interface GpgDepot {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

interface CodFeeMatrix {
  origin_depot_id: string
  destination_depot_id: string
  fee: number
  distance_km: number
}

interface NewCodRequestPageProps {
  originalOrder: OriginalOrder
  gpgDepots: GpgDepot[]
  codFeeMatrix: CodFeeMatrix[]
}

export default function NewCodRequestPage({
  originalOrder,
  gpgDepots,
  codFeeMatrix
}: NewCodRequestPageProps) {
  const router = useRouter()
  const [selectedDepotId, setSelectedDepotId] = useState<string | null>(null)
  const [hoveredDepotId, setHoveredDepotId] = useState<string | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [mapResetKey, setMapResetKey] = useState(0)

  // Tính toán depot được chọn và phí COD
  const selectedDepot = useMemo(() => {
    if (!selectedDepotId) return null
    return gpgDepots.find(depot => depot.id === selectedDepotId) || null
  }, [selectedDepotId, gpgDepots])

  const selectedCodFee = useMemo(() => {
    if (!selectedDepotId || !originalOrder.depot_id) return null
    
    const feeEntry = codFeeMatrix.find(
      entry => 
        entry.origin_depot_id === originalOrder.depot_id && 
        entry.destination_depot_id === selectedDepotId
    )
    
    return feeEntry ? feeEntry.fee : null
  }, [selectedDepotId, originalOrder.depot_id, codFeeMatrix])

  // Tính toán danh sách depot với phí COD để hiển thị trong bảng so sánh
  const depotsWithFees = useMemo(() => {
    if (!originalOrder.depot_id) return []
    
    return gpgDepots.map(depot => {
      const feeEntry = codFeeMatrix.find(
        entry => 
          entry.origin_depot_id === originalOrder.depot_id && 
          entry.destination_depot_id === depot.id
      )
      
      return {
        ...depot,
        fee: feeEntry?.fee || 0,
        distance_km: feeEntry?.distance_km || 0
      }
    }).sort((a, b) => a.fee - b.fee) // Sắp xếp theo phí tăng dần
  }, [gpgDepots, codFeeMatrix, originalOrder.depot_id])

  const handleDepotSelect = (depotId: string) => {
    setSelectedDepotId(depotId)
  }

  const handleDepotHover = (depotId: string | null) => {
    setHoveredDepotId(depotId)
  }

  const handleBack = () => {
    router.push('/dispatcher/containers')
  }
  
  const handleMapRetry = () => {
    setMapResetKey(prev => prev + 1)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Yêu cầu Thay đổi Nơi Trả Container (COD)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Container: <span className="font-medium">{originalOrder.container_number}</span>
              {originalOrder.depot && (
                <span className="ml-4">
                  Depot hiện tại: <span className="font-medium">{originalOrder.depot.name}</span>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Bảng So sánh */}
        {sidebarVisible && (
          <div className="w-80 bg-white border-r shadow-sm overflow-y-auto">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Depot GPG Khả dụng</h2>
              <p className="text-sm text-gray-600 mt-1">
                Sắp xếp theo phí COD thấp nhất
              </p>
            </div>
            <ComparisonTable
              originalDepotId={originalOrder.depot_id}
              depotsWithFees={depotsWithFees}
              selectedDepotId={selectedDepotId}
              hoveredDepotId={hoveredDepotId}
              onDepotSelect={handleDepotSelect}
              onDepotHover={handleDepotHover}
            />
          </div>
        )}

        {/* Map Area */}
        <div className="flex-1 relative h-full">
          {/* Toggle Sidebar Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="absolute top-4 left-4 z-[1000] bg-white shadow-md hover:bg-gray-50"
          >
            {sidebarVisible ? (
              <>
                <PanelLeftClose className="h-4 w-4 mr-2" />
                Ẩn sidebar
              </>
            ) : (
              <>
                <PanelLeftOpen className="h-4 w-4 mr-2" />
                Hiện sidebar
              </>
            )}
          </Button>
          
          <MapErrorBoundary onRetry={handleMapRetry}>
            <CodMap
              key={`cod-map-${originalOrder.id}-${mapResetKey}`}
              originalOrder={originalOrder}
              gpgDepots={gpgDepots}
              selectedDepotId={selectedDepotId}
              hoveredDepotId={hoveredDepotId}
              onDepotSelect={handleDepotSelect}
            />
          </MapErrorBoundary>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <ActionSummaryBar
        originalOrder={originalOrder}
        selectedDepot={selectedDepot}
        codFee={selectedCodFee}
        onBack={handleBack}
      />
    </div>
  )
}