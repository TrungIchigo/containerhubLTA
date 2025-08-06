'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Package, Building2, MapPin, Loader2 } from 'lucide-react'
import { requestMoreInfo } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import type { CodRequestWithDetails } from '@/lib/types'

interface CodRequestMoreInfoDialogProps {
  isOpen: boolean
  onClose: () => void
  request: CodRequestWithDetails
}

// Form validation schema
const requestInfoSchema = z.object({
  carrier_comment: z.string().min(10, 'Vui lòng nhập ít nhất 10 ký tự').max(500, 'Tối đa 500 ký tự')
})

type RequestInfoFormData = z.infer<typeof requestInfoSchema>

export default function CodRequestMoreInfoDialog({ isOpen, onClose, request }: CodRequestMoreInfoDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<RequestInfoFormData>({
    resolver: zodResolver(requestInfoSchema),
    defaultValues: {
      carrier_comment: ''
    }
  })

  const handleRequestInfo = async (data: RequestInfoFormData) => {
    setIsLoading(true)

    try {
      const result = await requestMoreInfo(request.id, data.carrier_comment)

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
      console.error('Error requesting more info:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi gửi yêu cầu bổ sung',
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-600" />
            Yêu Cầu Bổ Sung Thông Tin
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleRequestInfo)} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
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
                  <span className="font-medium">Lý do từ công ty:</span>
                  <p className="text-sm text-text-secondary bg-white p-2 rounded border">
                    {request.reason_for_request}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Yêu cầu bổ sung */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Thông Tin Cần Bổ Sung
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="carrier_comment">
                Mô tả thông tin cần bổ sung *
              </Label>
              <Textarea
                id="carrier_comment"
                placeholder="Ví dụ: Vui lòng cung cấp số booking liên quan cho chuyến hàng tiếp theo..."
                className="border-border focus:border-primary min-h-[100px]"
                {...form.register('carrier_comment')}
              />
              {form.formState.errors.carrier_comment && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.carrier_comment.message}
                </p>
              )}
              
              <p className="text-sm text-text-secondary">
                Hãy mô tả rõ ràng thông tin bạn cần để có thể xem xét yêu cầu này.
                Công ty vận tải sẽ nhận được thông báo và có thể cung cấp thêm thông tin.
              </p>
            </div>
          </div>

          {/* Xác nhận */}
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800">Yêu cầu bổ sung thông tin</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Yêu cầu COD sẽ chuyển sang trạng thái &quot;Chờ bổ sung thông tin&quot;.
                  Công ty vận tải sẽ nhận được thông báo và có thể cung cấp thêm chi tiết.
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

          </div>

          {/* Action buttons - Fixed at bottom */}
          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0 mt-4">
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
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Gửi Yêu Cầu
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}