'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, Package, Building2, Info } from 'lucide-react'
import { createCodRequest } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import DepotSelector from '@/components/common/DepotSelector'
import ConfirmCodRequestDialog from './ConfirmCodRequestDialog'
import type { ImportContainer } from '@/lib/types'
import { getCodFeeClient, formatCodFee, type CodFeeResult } from '@/lib/actions/cod-fee-client'

interface CodRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  container: ImportContainer
}

// Form validation schema
const codRequestSchema = z.object({
  city_id: z.string().min(1, 'Thành phố là bắt buộc'),
  depot_id: z.string().min(1, 'Depot mới là bắt buộc'),
  reason_for_request: z.string().optional()
})

type CodRequestFormData = z.infer<typeof codRequestSchema>

export default function CodRequestDialog({ isOpen, onClose, container }: CodRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [codFee, setCodFee] = useState<CodFeeResult | null>(null)
  const [isLoadingFee, setIsLoadingFee] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedDepotName, setSelectedDepotName] = useState<string>('')
  const [selectedCityName, setSelectedCityName] = useState<string>('')
  const { toast } = useToast()

  const form = useForm<CodRequestFormData>({
    resolver: zodResolver(codRequestSchema),
    defaultValues: {
      city_id: '',
      depot_id: '',
      reason_for_request: ''
    }
  })

  // Function to calculate COD fee
  const calculateCodFee = async (originDepotId: string, destinationDepotId: string) => {
    if (!originDepotId || !destinationDepotId) {
      setCodFee(null)
      return
    }

    setIsLoadingFee(true)
    try {
              const result = await getCodFeeClient(originDepotId, destinationDepotId)
      setCodFee(result)
    } catch (error) {
      console.error('Error calculating COD fee:', error)
      setCodFee({
        success: false,
        message: 'Không thể tính phí COD'
      })
    } finally {
      setIsLoadingFee(false)
    }
  }

  // Watch for depot changes to calculate fee
  const watchedDepotId = form.watch('depot_id')
  
  useEffect(() => {
    if (watchedDepotId && container?.depot_id) {
      calculateCodFee(container.depot_id, watchedDepotId)
    } else {
      setCodFee(null)
    }
  }, [watchedDepotId, container?.depot_id])

  const onSubmit = async (data: CodRequestFormData) => {
    // Mở dialog xác nhận thay vì gửi trực tiếp
    setShowConfirm(true)
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      setSelectedDepotName('')
      setSelectedCityName('')
      setCodFee(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Tạo Yêu Cầu Thay Đổi Nơi Giao Trả
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-full overflow-hidden">
          {/* Thông tin Container hiện tại */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Thông tin Container
            </h3>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium">Số Container:</span>
                <Badge variant="outline" className="font-mono">
                  {container.container_number}
                </Badge>
              </div>
              
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium">Nơi trả theo lệnh gốc:</span>
                  <div className="text-text-secondary text-sm break-words">
                    {container.drop_off_location}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Loại Container:</span>
                <Badge variant="secondary">
                  {typeof container.container_type === 'object' && container.container_type && 'code' in container.container_type
                    ? (container.container_type as any).code 
                    : container.container_type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Form chọn địa điểm mới */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Địa Điểm Mới Mong Muốn
            </h3>
            
            <DepotSelector
              cityValue={form.watch('city_id')}
              depotValue={form.watch('depot_id')}
              onCityChange={(cityId: string, cityName?: string) => {
                form.setValue('city_id', cityId)
                if (cityName) {
                  setSelectedCityName(cityName)
                }
                // Reset depot khi đổi city
                form.setValue('depot_id', '')
                setSelectedDepotName('')
              }}
              onDepotChange={(depotId: string, depotName?: string) => {
                form.setValue('depot_id', depotId)
                if (depotName) {
                  setSelectedDepotName(depotName)
                }
              }}
              cityError={form.formState.errors.city_id?.message}
              depotError={form.formState.errors.depot_id?.message}
              required={true}
              cityLabel="Thành phố/Tỉnh mới"
              depotLabel="Depot/Địa điểm mới"
            />

            {/* COD Fee Display */}
            {watchedDepotId && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Phí COD (Change of Destination)</span>
                </div>
                
                {isLoadingFee ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang tính phí...</span>
                  </div>
                ) : codFee ? (
                  <div className="space-y-1">
                    {codFee.success ? (
                      <div>
                        <div className="text-lg font-bold text-blue-800">
                          {formatCodFee(codFee.fee || 0)}
                        </div>
                        {codFee.message && (
                          <div className="text-xs text-blue-600">{codFee.message}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        {codFee.message || 'Không thể tính phí'}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Lý do yêu cầu */}
          <div className="space-y-2">
            <Label htmlFor="reason_for_request">
              Lý do yêu cầu (tùy chọn)
            </Label>
            <Textarea
              id="reason_for_request"
              placeholder="Ví dụ: Tiện đường cho xe lấy hàng cho chuyến tiếp theo..."
              className="border-border focus:border-primary min-h-[60px] text-sm"
              {...form.register('reason_for_request')}
            />
            <p className="text-xs text-text-secondary">
              <span className="flex items-center gap-1"><Info className="h-3 w-3 text-primary" /> Cung cấp lý do sẽ giúp hãng tàu xem xét yêu cầu nhanh hơn</span>
            </p>
          </div>

          {/* Form errors */}
          {form.formState.errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                {form.formState.errors.root.message}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary-dark text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Xem Lại & Gửi
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Confirm Dialog */}
      <ConfirmCodRequestDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onSuccess={() => {
          form.reset()
          setShowConfirm(false)
          onClose()
        }}
        container={container}
        formData={form.getValues()}
        codFee={codFee}
        selectedDepotName={selectedDepotName}
        selectedCityName={selectedCityName}
      />
    </Dialog>
  )
} 