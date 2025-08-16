'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  MapPin,
  Package,
  Building,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { ImportContainer, Organization } from '@/lib/types'
import { formatStoredDateTimeVN } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ContainerDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  container: ImportContainer & {
    shipping_line?: Organization
    trucking_company?: Organization
  }
  onUpdate?: () => void
}

export default function ContainerDetailDialog({
  isOpen,
  onClose,
  container,
  onUpdate
}: ContainerDetailDialogProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editData, setEditData] = useState({
    container_number: container.container_number || '',
    drop_off_location: container.drop_off_location || '',
    available_from_datetime: container.available_from_datetime || ''
  })

  // Status mapping cho container
  const IMPORT_CONTAINER_STATUS = [
    'AVAILABLE',
    'AWAITING_REUSE_APPROVAL',
    'COD_REJECTED',
    'AWAITING_COD_APPROVAL',
    'AWAITING_COD_PAYMENT',
    'AWAITING_REUSE_PAYMENT',
    'ON_GOING_COD',
    'ON_GOING_REUSE',
    'DEPOT_PROCESSING',
    'COMPLETED',
    'REUSE_REJECTED',
    'EXPIRED',
    'PAYMENT_CANCELLED'
  ] as const;
  type ImportContainerStatus = typeof IMPORT_CONTAINER_STATUS[number];

  const statusMap: Record<ImportContainerStatus, { text: string; variant: "default" | "warning" | "info" | "secondary" | "accent" | "destructive" | "approved" | "outline" | "pending" | "declined" | "confirmed" | "new-order" | "pending-reuse" | "pending-cod" | "pending-cod-payment" | "pending-reuse-payment" | "processing-cod" | "processing-reuse" | "processing-depot" | "completed" | "declined-cod" | "declined-reuse"; color: string }> = {
    AVAILABLE: { text: 'Lệnh mới tạo', variant: 'new-order', color: 'text-green-600' },
    AWAITING_REUSE_APPROVAL: { text: 'Chờ duyệt Re-use', variant: 'pending-reuse', color: 'text-yellow-600' },
    COD_REJECTED: { text: 'Bị từ chối COD', variant: 'declined-cod', color: 'text-red-600' },
    AWAITING_COD_APPROVAL: { text: 'Chờ duyệt COD', variant: 'pending-cod', color: 'text-orange-600' },
    AWAITING_COD_PAYMENT: { text: 'Chờ thanh toán phí COD', variant: 'pending-cod-payment', color: 'text-orange-600' },
    AWAITING_REUSE_PAYMENT: { text: 'Chờ thanh toán phí Re-use', variant: 'pending-reuse-payment', color: 'text-orange-600' },
    ON_GOING_COD: { text: 'Đang thực hiện COD', variant: 'processing-cod', color: 'text-blue-600' },
  ON_GOING_REUSE: { text: 'Đang thực hiện Re-use', variant: 'processing-reuse', color: 'text-blue-600' },
    DEPOT_PROCESSING: { text: 'Đang xử lý tại Depot', variant: 'processing-depot', color: 'text-purple-600' },
    COMPLETED: { text: 'Hoàn tất', variant: 'completed', color: 'text-green-600' },
    REUSE_REJECTED: { text: 'Bị từ chối Re-use', variant: 'declined-reuse', color: 'text-red-600' },
    EXPIRED: { text: 'Hết hạn', variant: 'outline', color: 'text-gray-600' },
    PAYMENT_CANCELLED: { text: 'Đã hủy thanh toán', variant: 'outline', color: 'text-gray-600' },
  };

  const getStatusInfo = (status: string) => {
    return statusMap[status as ImportContainerStatus] || { text: status, variant: 'outline' as const, color: 'text-gray-600' };
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData({
      container_number: container.container_number || '',
      drop_off_location: container.drop_off_location || '',
      available_from_datetime: container.available_from_datetime || ''
    })
  }

  const handleSave = async () => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('import_containers')
        .update({
          container_number: editData.container_number,
          drop_off_location: editData.drop_off_location,
          available_from_datetime: editData.available_from_datetime
        })
        .eq('id', container.id)

      if (error) throw error

      toast({
        title: "Thành công",
        description: "Cập nhật thông tin container thành công!",
      })
      setIsEditing(false)
      onUpdate?.()
      onClose()
    } catch (error: any) {
      console.error('Error updating container:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật: " + error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (container.status !== 'AVAILABLE') {
      toast({
        title: "Lỗi",
        description: "Không thể xóa container đang trong quá trình xử lý",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('import_containers')
        .delete()
        .eq('id', container.id)

      if (error) throw error

      toast({
        title: "Thành công",
        description: "Xóa container thành công!",
      })
      setShowDeleteConfirm(false)
      onUpdate?.()
      onClose()
    } catch (error: any) {
      console.error('Error deleting container:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const statusInfo = getStatusInfo(container.status)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Chi tiết Container {container.container_number}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Sửa
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={container.status !== 'AVAILABLE'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="container-number" className="text-sm font-medium">
                  Số Container *
                </Label>
                {isEditing ? (
                  <Input
                    id="container-number"
                    value={editData.container_number}
                    onChange={(e) => setEditData(prev => ({ ...prev, container_number: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium text-lg">{container.container_number}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Loại Container</Label>
                <div className="mt-1">
                  {isEditing ? (
                    <Input
                      value={container.container_type || ''}
                      className="mt-1"
                      disabled
                    />
                  ) : (
                    <Badge variant="outline" className="text-sm">
                      {container.container_type || 'N/A'}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Hãng Tàu</Label>
                {isEditing ? (
                  <Input
                    value={container.shipping_line?.name || ''}
                    className="mt-1"
                    disabled
                  />
                ) : (
                  <p className="mt-1">{container.shipping_line?.name || 'N/A'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="drop-off-location" className="text-sm font-medium">
                  Địa Điểm Dỡ Hàng *
                </Label>
                {isEditing ? (
                  <Input
                    id="drop-off-location"
                    value={editData.drop_off_location}
                    onChange={(e) => setEditData(prev => ({ ...prev, drop_off_location: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">{container.drop_off_location}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Trạng Thái</Label>
                <div className="mt-1">
                  <Badge variant={statusInfo.variant} className="text-sm">
                    {statusInfo.text}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="available-datetime" className="text-sm font-medium">
                  Thời Gian Rảnh *
                </Label>
                {isEditing ? (
                  <Input
                    id="available-datetime"
                    type="datetime-local"
                    value={editData.available_from_datetime?.slice(0, 16) || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, available_from_datetime: e.target.value + ':00' }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">{formatStoredDateTimeVN(container.available_from_datetime)}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Công Ty Vận Tải</Label>
                {isEditing ? (
                  <Input
                    value={container.trucking_company?.name || ''}
                    className="mt-1"
                    disabled
                  />
                ) : (
                  <p className="mt-1">{container.trucking_company?.name || 'N/A'}</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <div>
                    <Label className="text-sm font-medium">Ngày Tạo</Label>
                    <p className="mt-1">{formatStoredDateTimeVN(container.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Lưu Thay Đổi
                </Button>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Xác nhận xóa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa container <strong>{container.container_number}</strong>?
              <br />
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isDeleting ? (
              <>
                <Button variant="outline" disabled>Hủy</Button>
                <Button disabled className="bg-red-600 hover:bg-red-700">
                  Đang xóa...
                </Button>
              </>
            ) : (
              <>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Xóa
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}