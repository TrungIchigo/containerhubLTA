'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, MapPin, DollarSign } from 'lucide-react'
import ConfirmationDialog from '@/components/features/cod/ConfirmationDialog'

interface OriginalOrder {
  id: string
  container_number: string
  container_type: string
  depot_id: string
  depot?: {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
  }
}

interface SelectedDepot {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

interface ActionSummaryBarProps {
  originalOrder: OriginalOrder
  selectedDepot: SelectedDepot | null
  codFee: number | null
  onBack: () => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function ActionSummaryBar({
  originalOrder,
  selectedDepot,
  codFee,
  onBack
}: ActionSummaryBarProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  const hasSelection = selectedDepot && codFee !== null

  return (
    <>
      <div className="bg-white border-t shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Summary info */}
          <div className="flex-1">
            {!hasSelection ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <p className="text-gray-600">
                  Vui lòng chọn một depot mới trên bản đồ hoặc từ danh sách để xem chi tiết
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {/* Depot change info */}
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Thay đổi nơi trả về:</p>
                    <p className="font-semibold text-gray-900">
                      {selectedDepot.name}
                    </p>
                  </div>
                </div>

                {/* Fee info */}
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Phí COD:</p>
                    <p className="font-semibold text-gray-900">
                      {codFee === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        formatCurrency(codFee)
                      )}
                    </p>
                  </div>
                </div>

                {/* Container info */}
                <div className="text-sm text-gray-500">
                  <p>Container: <span className="font-medium">{originalOrder.container_number}</span></p>
                  <p>Loại: <span className="font-medium">{originalOrder.container_type}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onBack}
            >
              Hủy
            </Button>
            
            <Button
              disabled={!hasSelection}
              onClick={() => setShowConfirmDialog(true)}
              className="flex items-center gap-2"
            >
              Tiếp tục
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Bước 1: Chọn depot</span>
            <span>Bước 2: Xác nhận</span>
            <span>Bước 3: Hoàn tất</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: hasSelection ? '66%' : '33%' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && selectedDepot && codFee !== null && (
        <ConfirmationDialog
          originalOrder={originalOrder}
          selectedDepot={selectedDepot}
          codFee={codFee}
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        />
      )}
    </>
  )
}