'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { approveOrganization, rejectOrganization } from '@/lib/actions/admin'
import { useToast } from '@/hooks/use-toast'

interface AdminActionButtonsProps {
  organizationId: string
}

export function AdminActionButtons({ organizationId }: AdminActionButtonsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  
  const router = useRouter()
  const { toast } = useToast()

  const handleApprove = async () => {
    setIsApproving(true)
    
    try {
      const result = await approveOrganization(organizationId)
      
      if (result.success) {
        toast({
          title: "Phê duyệt thành công",
          description: result.message,
          variant: "default"
        })
        setShowApproveDialog(false)
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        toast({
          title: "Lỗi phê duyệt",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi hệ thống",
        description: "Có lỗi xảy ra khi phê duyệt tổ chức",
        variant: "destructive"
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive"
      })
      return
    }

    setIsRejecting(true)
    
    try {
      const result = await rejectOrganization(organizationId, rejectionReason)
      
      if (result.success) {
        toast({
          title: "Từ chối thành công",
          description: result.message,
          variant: "default"
        })
        setShowRejectDialog(false)
        setRejectionReason('')
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        toast({
          title: "Lỗi từ chối",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi hệ thống",
        description: "Có lỗi xảy ra khi từ chối tổ chức",
        variant: "destructive"
      })
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex space-x-3">
      {/* Approve Button & Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Phê duyệt tổ chức
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận phê duyệt</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn phê duyệt tổ chức này? Sau khi phê duyệt, tổ chức sẽ có thể truy cập đầy đủ các tính năng của hệ thống.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Sau khi phê duyệt:</p>
                <ul className="text-sm text-green-700 mt-1 list-disc list-inside space-y-1">
                  <li>Tổ chức có thể đăng nhập và sử dụng hệ thống</li>
                  <li>Email thông báo sẽ được gửi đến người đăng ký</li>
                  <li>Trạng thái sẽ chuyển thành "Đang hoạt động"</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowApproveDialog(false)}
              disabled={isApproving}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Button & Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogTrigger asChild>
          <Button variant="destructive">
            <XCircle className="h-4 w-4 mr-2" />
            Từ chối tổ chức
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối tổ chức</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để thông báo cho người đăng ký. Lý do này sẽ được gửi qua email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Lý do từ chối *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Nhập lý do từ chối (ví dụ: Thông tin MST không chính xác, Thiếu giấy tờ chứng minh...)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Sau khi từ chối:</p>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside space-y-1">
                    <li>Email thông báo từ chối sẽ được gửi kèm lý do</li>
                    <li>Tổ chức không thể đăng nhập vào hệ thống</li>
                    <li>Trạng thái sẽ chuyển thành "Đã từ chối"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionReason('')
              }}
              disabled={isRejecting}
            >
              Hủy
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 