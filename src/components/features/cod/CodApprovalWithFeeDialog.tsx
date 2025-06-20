'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Package, Building2, MapPin, Loader2 } from 'lucide-react'
import { handleCodDecision } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import type { CodRequestWithDetails } from '@/lib/types'

interface CodApprovalWithFeeDialogProps {
  isOpen: boolean
  onClose: () => void
  request: CodRequestWithDetails
}

// Form validation schema
const approvalWithFeeSchema = z.object({
  cod_fee: z.number().min(0, 'Phí COD phải >= 0').max(100000000, 'Phí COD quá lớn')
})

type ApprovalWithFeeFormData = z.infer<typeof approvalWithFeeSchema>

export default function CodApprovalWithFeeDialog({ isOpen, onClose, request }: CodApprovalWithFeeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<ApprovalWithFeeFormData>({
    resolver: zodResolver(approvalWithFeeSchema),
    defaultValues: {
      cod_fee: request.cod_fee || 0 // Sử dụng phí đã tính hoặc 0
    }
  })

  const handleApproveWithFee = async (data: ApprovalWithFeeFormData) => {
    setIsLoading(true)

    try {
      const result = await handleCodDecision(request.id, 'APPROVED', data.cod_fee)

      if (result.success) {
              toast({
        title: "✅ Thành công",
        description: result.message,
        variant: "success"
      })
        onClose()
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error approving COD request with fee:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi phê duyệt yêu cầu',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      onClose()
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Phê Duyệt Yêu Cầu COD (Kèm Phí)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleApproveWithFee)} className="space-y-6">
          {/* Thông tin yêu cầu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Thông tin Yêu Cầu
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium">Container:</span>
                <Badge variant="outline" className="font-mono">
                  {request.import_container?.container_number}
                </Badge>
                <Badge variant="secondary">
                  {request.import_container?.container_type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Công ty yêu cầu:</span>
                <span className="text-text-secondary">
                  {request.requesting_org?.name}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Từ:</span>
                  <span className="text-text-secondary text-sm">
                    {request.original_depot_address}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Đến:</span>
                  <span className="text-text-secondary text-sm">
                    {request.requested_depot?.name}
                  </span>
                </div>
              </div>
              
              {request.reason_for_request && (
                <div className="space-y-1">
                  <span className="font-medium">Lý do:</span>
                  <p className="text-sm text-text-secondary bg-white p-2 rounded border">
                    {request.reason_for_request}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Phí COD */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Phí COD
            </h3>
            
            {/* Hiển thị phí đã tính */}
            {request.cod_fee && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    Phí đã tính tự động: {formatCurrency(request.cod_fee)}
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Hệ thống đã tự động tính phí dựa trên khoảng cách giữa các depot
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="cod_fee">
                Phí thay đổi nơi trả (VNĐ) *
              </Label>
              <Input
                id="cod_fee"
                type="number"
                min="0"
                step="1000"
                placeholder="200000"
                className="border-border focus:border-primary"
                {...form.register('cod_fee', { valueAsNumber: true })}
              />
              {form.formState.errors.cod_fee && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.cod_fee.message}
                </p>
              )}
              
              <p className="text-xs text-text-secondary">
                Bạn có thể giữ nguyên phí đã tính hoặc điều chỉnh theo chính sách của hãng tàu
              </p>
              
              {/* Preview phí */}
              {form.watch('cod_fee') > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      Phí COD cuối cùng: {formatCurrency(form.watch('cod_fee'))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Xác nhận */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Phê duyệt có phí</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Bạn đang phê duyệt yêu cầu thay đổi nơi trả container này với phí COD.
                  Phí này sẽ được ghi nhận và thông báo cho công ty vận tải.
                </p>
              </div>
            </div>
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
          <div className="flex justify-end gap-3 pt-4 border-t">
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Phê Duyệt (Kèm Phí)
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 