'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { XCircle, Clock, AlertTriangle } from 'lucide-react'
import { declineRequest } from '@/lib/actions/carrier-admin'

interface DeclineRequestDialogProps {
  children: React.ReactNode
  request: {
    id: string
    import_container?: {
      container_number: string
      container_type: string
    }
    requesting_org?: {
      name: string
    }
  }
  onActionComplete?: (success: boolean, message: string) => void
}

interface FormData {
  reason: string
}

export default function DeclineRequestDialog({ 
  children, 
  request, 
  onActionComplete 
}: DeclineRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await declineRequest(request.id, data.reason)
      onActionComplete?.(true, 'Yêu cầu đã được từ chối.')
      setOpen(false)
      reset()
    } catch (error) {
      console.error('Error declining request:', error)
      onActionComplete?.(false, 'Có lỗi xảy ra khi từ chối yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Xác nhận Từ chối Yêu cầu?
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-4">
              <p>
                Bạn sắp từ chối yêu cầu tái sử dụng container{' '}
                <span className="font-semibold text-text-primary">
                  {request.import_container?.container_number}
                </span>{' '}
                của công ty{' '}
                <span className="font-semibold text-text-primary">
                  {request.requesting_org?.name}
                </span>.
              </p>
              
              <div className="bg-warning-light p-3 rounded-lg border border-warning/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-sm text-text-primary">
                  Cung cấp lý do từ chối sẽ giúp Công ty Vận tải hiểu và điều chỉnh trong các yêu cầu tương lai.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Lý do từ chối <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Ví dụ: Container này đã được điều động cho việc khác..."
                className="min-h-[100px] resize-none"
                {...register('reason', {
                  required: 'Vui lòng nhập lý do từ chối',
                  minLength: {
                    value: 10,
                    message: 'Lý do phải có ít nhất 10 ký tự'
                  }
                })}
              />
              {errors.reason && (
                <p className="text-destructive text-sm">
                  {errors.reason.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Xác nhận Từ chối
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 