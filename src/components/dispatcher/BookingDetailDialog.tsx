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
  FileText
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { ExportBooking, Organization } from '@/lib/types'
import { formatStoredDateTimeVN } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface BookingDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  booking: ExportBooking & {
    shipping_line?: Organization
    trucking_company?: Organization
    container_type?: any
    notes?: string
    updated_at?: string
  }
  onUpdate?: () => void
}

export default function BookingDetailDialog({
  isOpen,
  onClose,
  booking,
  onUpdate
}: BookingDetailDialogProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editData, setEditData] = useState({
    booking_number: booking.booking_number || '',
    pick_up_location: booking.pick_up_location || '',
    needed_by_datetime: booking.needed_by_datetime || '',
    required_container_type: booking.required_container_type || '',
    notes: booking.notes || ''
  })

  // Status mapping cho booking
  const statusMap = {
    'AVAILABLE': { text: 'Lệnh mới tạo', variant: 'new-order' as const, color: 'text-green-600' },
    'AWAITING_APPROVAL': { text: 'Chờ duyệt Re-use', variant: 'pending-reuse' as const, color: 'text-yellow-600' },
    'CONFIRMED': { text: 'Đã ghép', variant: 'processing-reuse' as const, color: 'text-blue-600' },
  }

  const getStatusInfo = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const, color: 'text-gray-600' }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditData({
      booking_number: booking.booking_number || '',
      pick_up_location: booking.pick_up_location || '',
      needed_by_datetime: booking.needed_by_datetime || '',
      required_container_type: booking.required_container_type || '',
      notes: booking.notes || ''
    })
  }

  const handleSave = async () => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('export_bookings')
        .update({
          booking_number: editData.booking_number,
          pick_up_location: editData.pick_up_location,
          needed_by_datetime: editData.needed_by_datetime,
          required_container_type: editData.required_container_type,
          notes: editData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id)

      if (error) throw error

      toast({
        title: "Thành công",
        description: "Cập nhật thông tin booking thành công!",
      })
      setIsEditing(false)
      onUpdate?.()
      onClose()
    } catch (error: any) {
      console.error('Error updating booking:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật: " + error.message,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (booking.status !== 'AVAILABLE') {
      toast({
        title: "Lỗi",
        description: "Không thể xóa booking đang trong quá trình xử lý",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from('export_bookings')
        .delete()
        .eq('id', booking.id)

      if (error) throw error

      toast({
        title: "Thành công",
        description: "Xóa booking thành công!",
      })
      setShowDeleteConfirm(false)
      onUpdate?.()
      onClose()
    } catch (error: any) {
      console.error('Error deleting booking:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa: " + error.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const statusInfo = getStatusInfo(booking.status)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chi tiết Booking {booking.booking_number}
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
                disabled={booking.status !== 'AVAILABLE'}
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
                <Label htmlFor="booking-number" className="text-sm font-medium">
                  Số Booking *
                </Label>
                {isEditing ? (
                  <Input
                    id="booking-number"
                    value={editData.booking_number}
                    onChange={(e) => setEditData(prev => ({ ...prev, booking_number: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium text-lg">{booking.booking_number}</p>
                )}
              </div>

              <div>
                <Label htmlFor="container-type" className="text-sm font-medium">
                  Loại Container Yêu Cầu *
                </Label>
                {isEditing ? (
                  <Input
                    id="container-type"
                    value={editData.required_container_type}
                    onChange={(e) => setEditData(prev => ({ ...prev, required_container_type: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-sm">
                      {booking.required_container_type || 'N/A'}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Hãng Tàu</Label>
                {isEditing ? (
                  <Input
                    value={booking.shipping_line?.name || ''}
                    className="mt-1"
                    disabled
                  />
                ) : (
                  <p className="mt-1">{booking.shipping_line?.name || 'N/A'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="pickup-location" className="text-sm font-medium">
                  Địa Điểm Lấy Hàng *
                </Label>
                {isEditing ? (
                  <Input
                    id="pickup-location"
                    value={editData.pick_up_location}
                    onChange={(e) => setEditData(prev => ({ ...prev, pick_up_location: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">{booking.pick_up_location}</p>
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
                <Label htmlFor="needed-datetime" className="text-sm font-medium">
                  Hạn lấy rỗng *
                </Label>
                {isEditing ? (
                  <Input
                    id="needed-datetime"
                    type="datetime-local"
                    value={editData.needed_by_datetime?.slice(0, 16) || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, needed_by_datetime: e.target.value + ':00' }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">{formatStoredDateTimeVN(booking.needed_by_datetime)}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Công Ty Vận Tải</Label>
                {isEditing ? (
                  <Input
                    value={booking.trucking_company?.name || ''}
                    className="mt-1"
                    disabled
                  />
                ) : (
                  <p className="mt-1">{booking.trucking_company?.name || 'N/A'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Ghi Chú
                </Label>
                {isEditing ? (
                  <textarea
                    id="notes"
                    rows={4}
                    value={editData.notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Nhập ghi chú..."
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-600">{booking.notes || 'Không có ghi chú'}</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <Label className="text-sm font-medium">Ngày Tạo</Label>
                    <p className="mt-1">{formatStoredDateTimeVN(booking.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Cập Nhật Cuối</Label>
                    <p className="mt-1">{booking.updated_at ? formatStoredDateTimeVN(booking.updated_at) : 'N/A'}</p>
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
              Bạn có chắc chắn muốn xóa booking <strong>{booking.booking_number}</strong>?
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