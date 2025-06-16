'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, Package, Building2 } from 'lucide-react'
import { createCodRequest } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import LocationSelector from '@/components/common/LocationSelector'
import type { ImportContainer } from '@/lib/types'

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
  const { toast } = useToast()

  const form = useForm<CodRequestFormData>({
    resolver: zodResolver(codRequestSchema),
    defaultValues: {
      city_id: '',
      depot_id: '',
      reason_for_request: ''
    }
  })

  const onSubmit = async (data: CodRequestFormData) => {
    setIsLoading(true)

    try {
      const result = await createCodRequest({
        dropoff_order_id: container.id,
        city_id: data.city_id,
        depot_id: data.depot_id,
        reason_for_request: data.reason_for_request || ''
      })

      if (result.success) {
        toast({
          title: "✅ Thành công",
          description: "Đã gửi yêu cầu thay đổi nơi giao trả thành công!",
          variant: "default"
        })
        
        // Reset form và đóng dialog
        form.reset()
        onClose()
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra')
      }
    } catch (error: any) {
      console.error('Error creating COD request:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.',
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
            <MapPin className="h-5 w-5 text-primary" />
            Tạo Yêu Cầu Thay Đổi Nơi Giao Trả
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Thông tin Container hiện tại */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Thông tin Container
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium">Số Container:</span>
                <Badge variant="outline" className="font-mono">
                  {container.container_number}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Nơi trả hiện tại:</span>
                <span className="text-text-secondary">
                  {container.drop_off_location}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Loại Container:</span>
                <Badge variant="secondary">
                  {container.container_type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Form chọn địa điểm mới */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Địa Điểm Mới Mong Muốn
            </h3>
            
            <LocationSelector
              cityValue={form.watch('city_id')}
              depotValue={form.watch('depot_id')}
              onCityChange={(cityId) => {
                form.setValue('city_id', cityId)
                // Reset depot khi đổi city
                form.setValue('depot_id', '')
              }}
              onDepotChange={(depotId) => form.setValue('depot_id', depotId)}
              cityError={form.formState.errors.city_id?.message}
              depotError={form.formState.errors.depot_id?.message}
              required={true}
              cityLabel="Thành phố/Tỉnh mới"
              depotLabel="Depot/Địa điểm mới"
            />
          </div>

          {/* Lý do yêu cầu */}
          <div className="space-y-2">
            <Label htmlFor="reason_for_request">
              Lý do yêu cầu (tùy chọn)
            </Label>
            <Textarea
              id="reason_for_request"
              placeholder="Ví dụ: Tiện đường cho xe lấy hàng cho chuyến tiếp theo..."
              className="border-border focus:border-primary min-h-[80px]"
              {...form.register('reason_for_request')}
            />
            <p className="text-sm text-text-secondary">
              Cung cấp lý do sẽ giúp hãng tàu xem xét yêu cầu nhanh hơn
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