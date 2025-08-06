'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, Package, Building2, Info, FileText, DollarSign, Send } from 'lucide-react'
import { createCodRequest } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import GpgDepotSelector from '@/components/common/GpgDepotSelector'
import ConfirmCodRequestDialog from './ConfirmCodRequestDialog'
import type { ImportContainer } from '@/lib/types/container'
import { getCodFeeClient, formatCodFee, type CodFeeResult } from '@/lib/actions/cod-fee-client'

interface CodRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  container: ImportContainer
  onSuccess?: () => void
}

// Form validation schema
const codRequestSchema = z.object({
  depot_id: z.string().min(1, 'Depot mới là bắt buộc'),
  reason_for_request: z.string().optional()
})

type CodRequestFormData = z.infer<typeof codRequestSchema>

export default function CodRequestDialog({ isOpen, onClose, container, onSuccess }: CodRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [codFee, setCodFee] = useState<CodFeeResult | null>(null)
  const [isLoadingFee, setIsLoadingFee] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedDepotName, setSelectedDepotName] = useState<string>('')
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const { toast } = useToast()

  // Common reasons for COD requests
  const commonReasons = [
    'Khách hàng yêu cầu thay đổi địa điểm',
    'Depot gốc quá xa hoặc không thuận tiện',
    'Giảm chi phí vận chuyển',
    'Tối ưu hóa lộ trình giao hàng',
    'Depot gốc đang bảo trì/sửa chữa',
    'Yêu cầu giao nhanh/khẩn cấp'
  ]

  const form = useForm<CodRequestFormData>({
    resolver: zodResolver(codRequestSchema),
    defaultValues: {
      depot_id: '',
      reason_for_request: ''
    }
  })

  // Function to calculate COD fee
  const calculateCodFee = useCallback(async (originDepotId: string | null, destinationDepotId: string) => {
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
  }, [])

  // Watch for depot changes to calculate fee
  const watchedDepotId = form.watch('depot_id')
  
  // Trong useEffect
  useEffect(() => {
    console.log('🔍 useEffect triggered:', { 
      watchedDepotId, 
      containerDepotId: container?.depot_id,
      containerNumber: container?.container_number 
    })
    
    if (watchedDepotId && container?.depot_id && watchedDepotId !== container.depot_id) {
      console.log('✅ Valid depot selection, calculating COD fee...')
      console.log('📍 Origin depot ID:', container.depot_id)
      console.log('📍 Destination depot ID:', watchedDepotId)
      calculateCodFee(container.depot_id, watchedDepotId)
    } else if (!watchedDepotId) {
      console.log('⚠️ No destination depot selected, clearing COD fee')
      setCodFee(null)
    } else {
      console.log('❌ Invalid depot selection:', {
        watchedDepotId,
        containerDepotId: container?.depot_id,
        isSame: watchedDepotId === container.depot_id
      })
    }
  }, [watchedDepotId, container?.depot_id, calculateCodFee]) // Theo dõi tất cả dependencies cần thiết

  const onSubmit = async (data: CodRequestFormData) => {
    // Mở dialog xác nhận thay vì gửi trực tiếp
    setShowConfirm(true)
  }

  // Store freetext separately to avoid recursive updates
  const [freetextReason, setFreetextReason] = useState('')

  // Handle checkbox selection
  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev => {
      const newReasons = prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
      
      // Update form value with combined reasons + freetext
      updateCombinedReasons(newReasons, freetextReason)
      return newReasons
    })
  }

  // Handle freetext change
  const handleFreetextChange = (value: string) => {
    setFreetextReason(value)
    updateCombinedReasons(selectedReasons, value)
  }

  // Helper to update combined reasons
  const updateCombinedReasons = (reasons: string[], freetext: string) => {
    const parts: string[] = []
    if (reasons.length > 0) {
      parts.push(reasons.join('; '))
    }
    if (freetext.trim()) {
      parts.push(freetext.trim())
    }
    const combinedText = parts.join('; ')
    form.setValue('reason_for_request', combinedText)
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      setSelectedDepotName('')
      setSelectedReasons([])
      setFreetextReason('')
      setCodFee(null)
      onClose()
    }
  }

  const handleSuccess = () => {
    form.reset()
    setSelectedReasons([])
    setFreetextReason('')
    setShowConfirm(false)
    onSuccess?.()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Tạo Yêu Cầu Thay Đổi Nơi Giao Trả
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Thông tin Container hiện tại */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Thông tin Container
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium">Container:</span>
                <Badge variant="outline" className="font-mono">
                  {container.container_number}
                </Badge>
                <Badge variant="secondary">
                  {container.container_type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Nơi trả theo lệnh gốc:</span>
                <span className="text-text-secondary truncate">
                  {container.drop_off_location}
                </span>
              </div>
            </div>
          </div>

          {/* Địa Điểm Mới */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-text-primary border-b pb-2">
              Địa Điểm Mới Mong Muốn
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <GpgDepotSelector
                  originDepotId={container.depot_id || undefined}
                  depotValue={form.watch('depot_id')}
                  onDepotChange={(depotId, depotName) => {
                    form.setValue('depot_id', depotId)
                    setSelectedDepotName(depotName || '')
                  }}
                  depotError={form.formState.errors.depot_id?.message}
                  required={true}
                  depotLabel="Depot GPG mới"
                />
              </div>
            </div>
          </div>



          {/* Phí COD */}
          {(codFee || isLoadingFee) && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-text-primary border-b pb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Phí Thay Đổi Nơi Giao Trả
              </h3>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                {isLoadingFee ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Đang tính phí...</span>
                  </div>
                ) : codFee?.success && codFee.fee ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Phí COD:</span>
                      <span className="text-lg font-semibold text-primary" data-testid="cod-fee">
                        {formatCodFee(codFee.fee)}
                      </span>
                    </div>
                    {codFee.message && (
                      <p className="text-sm text-muted-foreground">{codFee.message}</p>
                    )}
                  </div>
                ) : codFee && !codFee.success ? (
                  <div className="space-y-2">
                    <div className="text-sm text-red-600 font-medium">
                      ❌ Lỗi tính phí COD
                    </div>
                    <div className="text-sm text-red-600">
                      {codFee.message || 'Không thể tính phí cho tuyến này'}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Debug: Origin: {container?.depot_id}, Destination: {watchedDepotId}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Chọn depot để xem phí COD
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lý do yêu cầu */}
          <div className="space-y-3">
            <Label className="flex items-center text-base font-semibold">
              <FileText className="w-4 h-4 mr-2" />
              Lý do yêu cầu
            </Label>
            
            {/* Checkbox options */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Chọn lý do phổ biến:</div>
              <div className="grid grid-cols-1 gap-2">
                {commonReasons.map((reason, index) => (
                  <label key={index} className="flex items-start space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason)}
                      onChange={() => handleReasonToggle(reason)}
                      className="mt-0.5 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 leading-5">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Freetext input */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Lý do khác (tùy chọn):</div>
              <Textarea
                value={freetextReason}
                placeholder="Nhập lý do khác nếu có..."
                className="min-h-[80px]"
                onChange={(e) => handleFreetextChange(e.target.value)}
              />
            </div>

            {/* Preview combined text */}
            {(selectedReasons.length > 0 || form.watch('reason_for_request')) && (
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="text-xs font-medium text-gray-600 mb-1">Nội dung gửi đi:</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {form.watch('reason_for_request') || 'Chưa có lý do'}
                </div>
              </div>
            )}
          </div>

          </div>

          {/* Submit Button - Fixed at bottom */}
          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0 mt-4">
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
              disabled={isLoading || !codFee?.success}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gửi yêu cầu
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Confirm Dialog */}
        <ConfirmCodRequestDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onSuccess={handleSuccess}
          container={container}
          selectedDepotName={selectedDepotName}
          codFee={codFee}
          formData={{
            depot_id: form.getValues('depot_id') || '',
            reason_for_request: form.getValues('reason_for_request')
          } as { depot_id: string; reason_for_request?: string }}
        />
      </DialogContent>
    </Dialog>
  )
}