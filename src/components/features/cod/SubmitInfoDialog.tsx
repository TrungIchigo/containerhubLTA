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
import { MessageSquare, Package, Building2, MapPin, Loader2, AlertCircle } from 'lucide-react'
import { submitAdditionalInfo } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import type { CodRequestWithDetails } from '@/lib/types'

interface SubmitInfoDialogProps {
  isOpen: boolean
  onClose: () => void
  request: CodRequestWithDetails
}

// Form validation schema
const submitInfoSchema = z.object({
  additional_info: z.string().min(10, 'Vui lòng nhập ít nhất 10 ký tự').max(1000, 'Tối đa 1000 ký tự')
})

type SubmitInfoFormData = z.infer<typeof submitInfoSchema>

export default function SubmitInfoDialog({ isOpen, onClose, request }: SubmitInfoDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<SubmitInfoFormData>({
    resolver: zodResolver(submitInfoSchema),
    defaultValues: {
      additional_info: ''
    }
  })

  const handleSubmitInfo = async (data: SubmitInfoFormData) => {
    setIsLoading(true)

    try {
      const result = await submitAdditionalInfo(request.id, data.additional_info)

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
      console.error('Error submitting additional info:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi gửi thông tin bổ sung',
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-text-primary flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Cập Nhật Thông Tin Yêu Cầu Thay Đổi Địa Điểm
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmitInfo)} className="space-y-6">
          {/* Thông tin yêu cầu */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Thông tin Yêu Cầu
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm space-y-3">
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
                <span className="font-medium">Hãng tàu:</span>
                <span className="text-text-secondary">
                  {request.approving_org?.name}
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
                  <span className="font-medium">Lý do ban đầu:</span>
                  <p className="text-sm text-text-secondary bg-white p-2 rounded border">
                    {request.reason_for_request}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Yêu cầu từ hãng tàu */}
          {request.carrier_comment && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
                Yêu Cầu Từ Hãng Tàu
              </h3>
              
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-800 mb-2">
                      Thông tin cần bổ sung:
                    </h4>
                    <p className="text-sm text-orange-700 bg-white p-3 rounded border">
                      {request.carrier_comment}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form nhập thông tin bổ sung */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Thông Tin Bổ Sung
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="additional_info">
                Thông tin bổ sung *
              </Label>
              <Textarea
                id="additional_info"
                placeholder="Vui lòng cung cấp thông tin chi tiết theo yêu cầu của hãng tàu..."
                className="border-border focus:border-primary min-h-[120px]"
                {...form.register('additional_info')}
              />
              {form.formState.errors.additional_info && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.additional_info.message}
                </p>
              )}
              
              <p className="text-sm text-text-secondary">
                Hãy cung cấp thông tin chi tiết và chính xác để hãng tàu có thể xem xét yêu cầu của bạn.
                Sau khi gửi, yêu cầu sẽ chuyển về trạng thái &quot;Chờ duyệt&quot;.
              </p>
            </div>
          </div>

          {/* Xác nhận */}
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Gửi thông tin bổ sung</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Yêu cầu Thay Đổi Địa Điểm sẽ chuyển về trạng thái &quot;Chờ duyệt&quot; và hãng tàu sẽ nhận được thông báo.
                  Họ sẽ xem xét thông tin bổ sung và đưa ra quyết định cuối cùng.
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
                  Đang gửi...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Gửi Thông Tin
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 