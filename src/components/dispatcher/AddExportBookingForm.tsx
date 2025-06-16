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
import LocationSelector from '@/components/common/LocationSelector'
import { createClient } from '@/lib/supabase/client'

const formSchema = z.object({
  booking_number: z.string().min(1, 'Số booking là bắt buộc'),
  required_container_type: z.string().min(1, 'Loại container là bắt buộc'),
  cargo_type_id: z.string().min(1, 'Loại hàng hóa là bắt buộc'),
  city_id: z.string().min(1, 'Thành phố là bắt buộc'),
  depot_id: z.string().min(1, 'Depot/Địa điểm là bắt buộc'),
  needed_by_datetime: z.string().min(1, 'Thời gian cần container là bắt buộc'),
  attached_documents: z.array(z.string()).optional()
})

type FormData = z.infer<typeof formSchema>

export default function AddExportBookingForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [bookingId] = useState<string>(() => `temp_${Date.now()}`) // Temporary ID for uploads
  const { cargoOptions, loading: cargoLoading, error: cargoError } = useCargoTypes()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      booking_number: '',
      required_container_type: '20FT',
      cargo_type_id: '',
      city_id: '',
      depot_id: '',
      needed_by_datetime: '',
      attached_documents: []
    }
  })

  const containerTypes = [
    { value: '20FT', label: '20FT' },
    { value: '40FT', label: '40FT' },
    { value: '40HQ', label: '40HQ' },
    { value: '45FT', label: '45FT' }
  ]

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
      await addExportBooking(data)
      
      // Reset form and close dialog
      form.reset({
        booking_number: '',
        required_container_type: '20FT',
        cargo_type_id: '',
        city_id: '',
        depot_id: '',
        needed_by_datetime: '',
        attached_documents: []
      })
      setIsOpen(false)
    } catch (error: any) {
      console.error('Error adding booking:', error)
      form.setError('root', { 
        type: 'manual', 
        message: 'Có lỗi xảy ra. Vui lòng thử lại.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Booking Xuất
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Thêm Booking Xuất</DialogTitle>
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
                <Label htmlFor="booking_number">Số Booking *</Label>
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

              {/* Loại Container Cần */}
              <div className="space-y-2">
                <Label htmlFor="required_container_type">Loại Container Cần *</Label>
                <select
                  id="required_container_type"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  {...form.register('required_container_type')}
                >
                  {containerTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {form.formState.errors.required_container_type && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.required_container_type.message}
                  </p>
                )}
              </div>

              {/* Thời Gian Cần Container */}
              <div className="space-y-2">
                <Label htmlFor="needed_by_datetime">Thời Gian Cần Container *</Label>
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
              <LocationSelector
                cityValue={form.watch('city_id')}
                depotValue={form.watch('depot_id')}
                onCityChange={(cityId) => form.setValue('city_id', cityId)}
                onDepotChange={(depotId) => form.setValue('depot_id', depotId)}
                cityError={form.formState.errors.city_id?.message}
                depotError={form.formState.errors.depot_id?.message}
                required={true}
                cityLabel="Thành phố/Tỉnh"
                depotLabel="Depot/Địa điểm lấy hàng"
              />
            </div>

            {/* Loại Hàng Hóa */}
            <div className="space-y-2">
              <Label htmlFor="cargo_type_id" className="flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Loại Hàng Hóa *
              </Label>
              {cargoLoading ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Đang tải danh sách loại hàng hóa...</span>
                </div>
              ) : cargoError ? (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {cargoError}
                </div>
              ) : (
                <select
                  id="cargo_type_id"
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
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
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
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