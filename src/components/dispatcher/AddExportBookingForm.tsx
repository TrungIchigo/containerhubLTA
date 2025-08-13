'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2, Package, FileText } from 'lucide-react'
import { addExportBooking } from '@/lib/actions/dispatcher'
import { useCargoTypes } from '@/hooks/useCargoTypes'
import DocumentUploader from '@/components/common/DocumentUploader'
import DepotOnlySelector from '@/components/common/DepotOnlySelector'
import ContainerTypeSelect from '@/components/common/ContainerTypeSelect'
import { createClient } from '@/lib/supabase/client'
import type { Organization } from '@/lib/types'
import { validateContainerNumber, datetimeLocalToUTC, utcToDatetimeLocal } from '@/lib/utils'
import type { CreateExportBookingForm } from '@/lib/types'

const formSchema = z.object({
  booking_number: z.string().min(1, 'Số booking là bắt buộc'),
  container_type_id: z.string().min(1, 'Loại container là bắt buộc'),
  cargo_type_id: z.string().min(1, 'Loại hàng hóa là bắt buộc'),
  depot_id: z.string().min(1, 'Địa điểm lấy hàng là bắt buộc'),
  needed_by_datetime: z.string().min(1, 'Hạn lấy rỗng là bắt buộc'),
  shipping_line_org_id: z.string().min(1, 'Hãng tàu là bắt buộc'),
  attached_documents: z.array(z.string()).optional()
})

type FormData = z.infer<typeof formSchema>

interface AddExportBookingFormProps {
  shippingLines: Organization[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function AddExportBookingForm({
  shippingLines,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange
}: AddExportBookingFormProps) {
  
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [bookingId] = useState<string>(() => `temp_${Math.random().toString(36).substr(2, 9)}`) // Temporary ID for uploads
  const { cargoOptions, loading: cargoLoading, error: cargoError } = useCargoTypes()

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      booking_number: '',
      container_type_id: '',
      cargo_type_id: '',
      depot_id: '',
      needed_by_datetime: '',
      shipping_line_org_id: '',
      attached_documents: []
    }
  })

  // Get current user ID for file uploads
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    
    try {
      // Convert datetime to UTC for proper storage
      const processedData: CreateExportBookingForm = {
        booking_number: data.booking_number,
        container_type_id: data.container_type_id,
        cargo_type_id: data.cargo_type_id,
        depot_id: data.depot_id,
        needed_by_datetime: datetimeLocalToUTC(data.needed_by_datetime),
        shipping_line_org_id: data.shipping_line_org_id,
        attached_documents: data.attached_documents || []
      }
      
      await addExportBooking(processedData)
      
      // Reset form and close dialog
      form.reset({
        booking_number: '',
        container_type_id: '',
        cargo_type_id: '',
        depot_id: '',
        needed_by_datetime: '',
        shipping_line_org_id: '',
        attached_documents: []
      })
      if (externalOnOpenChange) {
        externalOnOpenChange(false)
      } else {
        setIsOpen(false)
      }
    } catch (error: any) {
      console.error('Error adding booking:', error)
      form.setError('root', { 
        type: 'manual', 
        message: error.message || 'Có lỗi xảy ra. Vui lòng thử lại.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Only show trigger button when not controlled externally */}
      {!externalIsOpen && !externalOnOpenChange && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium">
            <Plus className="mr-2 h-4 w-4" />
            Tạo Lệnh Lấy Rỗng
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent 
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
        aria-label="Form tạo lệnh lấy rỗng booking"
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary">Tạo Lệnh Lấy Rỗng</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Booking Information Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Thông tin Booking
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Số Booking */}
              <div className="space-y-2">
                <Label htmlFor="booking_number">Số Booking <span className="text-red-500">*</span></Label>
                <Input
                  id="booking_number"
                  type="text"
                  placeholder="BKG123456789"
                  className="border-border focus:border-primary"
                  {...form.register('booking_number')}
                />
                {form.formState.errors.booking_number && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.booking_number.message}
                  </p>
                )}
              </div>

              {/* Loại Container Cần Lấy */}
              <div className="space-y-2">
                <Label htmlFor="container_type_id">Loại Container Cần Lấy <span className="text-red-500">*</span></Label>
                <ContainerTypeSelect
                  value={form.watch('container_type_id')}
                  onValueChange={(value) => form.setValue('container_type_id', value)}
                  className="w-full"
                  placeholder="Chọn loại container"
                />
                {form.formState.errors.container_type_id && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.container_type_id.message}
                  </p>
                )}
              </div>

              {/* Hãng Tàu */}
              <div className="space-y-2">
                <Label htmlFor="shipping_line_org_id">Hãng Tàu <span className="text-red-500">*</span></Label>
                <select
                  id="shipping_line_org_id"
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  {...form.register('shipping_line_org_id')}
                >
                  <option value="">Chọn hãng tàu</option>
                  {shippingLines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.shipping_line_org_id && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.shipping_line_org_id.message}
                  </p>
                )}
              </div>

              {/* Hạn Lấy Rỗng */}
              <div className="space-y-2">
                <Label htmlFor="needed_by_datetime">Hạn Lấy Rỗng <span className="text-red-500">*</span></Label>
                <Input
                  id="needed_by_datetime"
                  type="datetime-local"
                  className="border-border focus:border-primary"
                  {...form.register('needed_by_datetime')}
                />
                {form.formState.errors.needed_by_datetime && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.needed_by_datetime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <DepotOnlySelector
                depotValue={form.watch('depot_id')}
                onDepotChange={(depotId) => {
                  form.setValue('depot_id', depotId)
                  form.clearErrors('depot_id')
                }}
                depotError={form.formState.errors.depot_id?.message}
                required
                depotLabel="Địa điểm lấy rỗng"
              />
            </div>

            {/* Loại Hàng Hóa */}
            <div className="space-y-2">
              <Label htmlFor="cargo_type_id" className="flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Loại Hàng Hóa <span className="text-red-500">*</span>
              </Label>
              {cargoLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Đang tải danh sách loại hàng hóa...</span>
                </div>
              ) : cargoError ? (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md shadow-sm">
                  {cargoError}
                </div>
              ) : (
                <select
                  id="cargo_type_id"
                  className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  {...form.register('cargo_type_id')}
                >
                  <option value="">Chọn loại hàng hóa</option>
                  {cargoOptions.map((cargo) => (
                    <option key={cargo.value} value={cargo.value} title={cargo.description}>
                      {cargo.label}
                      {cargo.requiresSpecialHandling && ' (Xử lý đặc biệt)'}
                    </option>
                  ))}
                </select>
              )}
              {form.formState.errors.cargo_type_id && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.cargo_type_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Chứng từ đính kèm
            </h3>
            
            {/* Attached Documents */}
            <div className="space-y-3">
              <Label className="flex items-center text-base font-medium">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Đính kèm chứng từ
              </Label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm">
                  <DocumentUploader
                  value={form.watch('attached_documents') || []}
                  onChange={(urls) => form.setValue('attached_documents', urls)}
                  userId={userId}
                  containerId={bookingId}
                  maxFiles={10}
                  required={false}
                  label=""
                  description=""
                />
              </div>
            </div>
          </div>

          {/* Thông báo lỗi chung */}
          {form.formState.errors.root && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md shadow-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (externalOnOpenChange) {
                  externalOnOpenChange(false)
                } else {
                  setIsOpen(false)
                }
              }}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || cargoLoading || !userId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}