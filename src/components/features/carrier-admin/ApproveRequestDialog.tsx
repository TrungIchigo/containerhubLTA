'use client'

import { useState } from 'react'
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
import { CheckCircle, Clock } from 'lucide-react'
import { approveRequest } from '@/lib/actions/carrier-admin'

interface ApproveRequestDialogProps {
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
    estimated_cost_saving?: number
    estimated_co2_saving_kg?: number
  }
  onActionComplete?: (success: boolean, message: string) => void
}

export default function ApproveRequestDialog({ 
  children, 
  request, 
  onActionComplete 
}: ApproveRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      await approveRequest(request.id)
      onActionComplete?.(true, 'Phê duyệt yêu cầu thành công!')
      setOpen(false)
    } catch (error) {
      console.error('Error approving request:', error)
      onActionComplete?.(false, 'Có lỗi xảy ra khi phê duyệt yêu cầu. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Xác nhận Phê duyệt Yêu cầu?
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-4">
            <p>
              Bạn sắp phê duyệt yêu cầu tái sử dụng container{' '}
              <span className="font-semibold text-text-primary">
                {request.import_container?.container_number}
              </span>{' '}
              cho công ty{' '}
              <span className="font-semibold text-text-primary">
                {request.requesting_org?.name}
              </span>.
            </p>
            
            {(request.estimated_cost_saving || request.estimated_co2_saving_kg) && (
              <div className="bg-primary-light p-3 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-text-primary mb-2">
                  Lợi ích ước tính:
                </p>
                <div className="space-y-1 text-sm">
                  {request.estimated_cost_saving && (
                    <div className="flex justify-between">
                      <span>Tiết kiệm chi phí:</span>
                      <span className="font-medium text-primary">
                        ${request.estimated_cost_saving}
                      </span>
                    </div>
                  )}
                  {request.estimated_co2_saving_kg && (
                    <div className="flex justify-between">
                      <span>Giảm phát thải CO₂:</span>
                      <span className="font-medium text-info">
                        {request.estimated_co2_saving_kg}kg
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="bg-primary hover:bg-primary-dark"
          >
            {isLoading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Xác nhận Phê duyệt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 