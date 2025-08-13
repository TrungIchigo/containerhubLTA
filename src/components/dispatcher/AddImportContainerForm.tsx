'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Loader2, Package, ImageIcon, FileText } from 'lucide-react'
import { addImportContainer } from '@/lib/actions/dispatcher'
import { validateContainerNumber, datetimeLocalToUTC, utcToDatetimeLocal } from '@/lib/utils'
import { useCargoTypes } from '@/hooks/useCargoTypes'
import ImageUploader from '@/components/common/ImageUploader'
import DocumentUploader from '@/components/common/DocumentUploader'
import DepotOnlySelector from '@/components/common/DepotOnlySelector'
import ContainerTypeSelect from '@/components/common/ContainerTypeSelect'
import { createClient } from '@/lib/supabase/client'
import type { Organization } from '@/lib/types'
import type { CreateImportContainerForm } from '@/lib/types'
import { useId } from 'react'

interface AddImportContainerFormProps {
  shippingLines: Organization[]
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const formSchema = z.object({
  container_number: z.string()
    .min(1, 'Số container là bắt buộc')
    .refine((val) => validateContainerNumber(val), 'Số container không hợp lệ'),
  container_type_id: z.string().min(1, 'Loại container là bắt buộc'),
  cargo_type_id: z.string().min(1, 'Loại hàng hóa là bắt buộc'),
  depot_id: z.string().min(1, 'Địa điểm dỡ hàng là bắt buộc'),
  available_from_datetime: z.string().min(1, 'Thời gian rảnh là bắt buộc'),
  shipping_line_org_id: z.string().min(1, 'Hãng tàu là bắt buộc'),
  condition_images: z.array(z.string()).optional(),
  attached_documents: z.array(z.string()).optional(),
  is_listed_on_marketplace: z.boolean().optional()
})

type FormData = z.infer<typeof formSchema>

export default function AddImportContainerForm({ 
  shippingLines, 
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange 
}: AddImportContainerFormProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const containerId = useId()
  const [isCheckingContainer, setIsCheckingContainer] = useState(false)
  const [containerNumberError, setContainerNumberError] = useState<string>('')
  const [containerNumberWarning, setContainerNumberWarning] = useState<string>('')
  const { cargoOptions, loading: cargoLoading, error: cargoError } = useCargoTypes()

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      container_number: '',
      container_type_id: '',
      cargo_type_id: '',
      depot_id: '',
      available_from_datetime: '',
      shipping_line_org_id: '',
      condition_images: [],
      attached_documents: [],
      is_listed_on_marketplace: false
    },
    mode: 'all' // Enable validation on change and blur
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

  // Check container number format and duplicates
  const checkContainer = async (containerNumber: string) => {
    console.log('Checking container:', containerNumber)
    
    if (!containerNumber) {
      setContainerNumberWarning('')
      setContainerNumberError('')
      return
    }

    // First validate format
    const isValid = validateContainerNumber(containerNumber)
    console.log('Container format valid:', isValid)
    
    if (!isValid) {
      const warningMsg = 'Số container không đúng định dạng ISO 6346'
      console.log('Setting warning:', warningMsg)
      setContainerNumberWarning(warningMsg)
      form.setError('container_number', {
        type: 'manual',
        message: warningMsg
      })
      setContainerNumberError('')
      return
    }

    setContainerNumberWarning('')
    setIsCheckingContainer(true)

    try {
      // Check for duplicates in Supabase
      const supabase = createClient()
      console.log('Checking for duplicates...')
      
      const { data: containers, error } = await supabase
        .from('import_containers')
        .select('container_number')
        .eq('container_number', containerNumber)
        .limit(1)

      console.log('Duplicate check result:', { containers, error })

      if (error) {
        console.error('Error checking container:', error)
        const errorMsg = 'Không thể kiểm tra số container. Vui lòng thử lại.'
        console.log('Setting error:', errorMsg)
        setContainerNumberError(errorMsg)
        form.setError('container_number', {
          type: 'manual',
          message: errorMsg
        })
      } else if (containers && containers.length > 0) {
        const errorMsg = 'Số container này đã tồn tại trong hệ thống'
        console.log('Setting error:', errorMsg)
        setContainerNumberError(errorMsg)
        form.setError('container_number', {
          type: 'manual',
          message: errorMsg
        })
      } else {
        console.log('No duplicates found, clearing errors')
        setContainerNumberError('')
        form.clearErrors('container_number')
      }
    } catch (error) {
      console.error('Error in container check:', error)
      const errorMsg = 'Không thể kiểm tra số container. Vui lòng thử lại.'
      console.log('Setting error:', errorMsg)
      setContainerNumberError(errorMsg)
      form.setError('container_number', {
        type: 'manual',
        message: errorMsg
      })
    } finally {
      setIsCheckingContainer(false)
    }
  }

  // Watch container number changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'container_number' && value.container_number) {
        console.log('Container number changed:', value.container_number)
        checkContainer(value.container_number)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    
    try {
      // Convert datetime to UTC for proper storage
      const processedData = {
        container_number: data.container_number,
        container_type_id: data.container_type_id,
        cargo_type_id: data.cargo_type_id,
        depot_id: data.depot_id,
        available_from_datetime: datetimeLocalToUTC(data.available_from_datetime),
        shipping_line_org_id: data.shipping_line_org_id,
        condition_images: data.condition_images || [],
        attached_documents: data.attached_documents || [],
        is_listed_on_marketplace: data.is_listed_on_marketplace || false
      } as CreateImportContainerForm
      
      console.log('Processed data:', processedData)
      await addImportContainer(processedData)
      
      // Reset form and close dialog
      form.reset()
      setContainerNumberError('')
      setContainerNumberWarning('')
      if (externalOnOpenChange) {
        externalOnOpenChange(false)
      } else {
        setIsOpen(false)
      }
    } catch (error: any) {
      console.error('Error adding container:', error)
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
      {!externalIsOpen && !externalOnOpenChange && (
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-medium">
            <Plus className="mr-2 h-4 w-4" />
            Tạo Lệnh Trả Rỗng
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent 
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
        aria-label="Form tạo lệnh trả rỗng container"
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary">Tạo Lệnh Trả Rỗng</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Thông tin Container
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Số Container */}
              <div className="space-y-2">
                <Label htmlFor={containerId}>Số Container</Label>
                <div className="relative">
                  <Input
                    id={containerId}
                    {...form.register('container_number', {
                      onChange: (e) => {
                        const value = e.target.value.toUpperCase()
                        e.target.value = value
                        form.setValue('container_number', value, {
                          shouldValidate: true
                        })
                      },
                      onBlur: (e) => {
                        checkContainer(e.target.value)
                      }
                    })}
                    placeholder="ABCD1234567"
                    className={`${
                      containerNumberError || containerNumberWarning ? 'border-red-500' : ''
                    }`}
                    aria-invalid={!!containerNumberError || !!containerNumberWarning}
                    aria-describedby={`${containerId}-error`}
                  />
                  {isCheckingContainer && (
                    <div className="absolute right-2 top-2">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {isCheckingContainer && (
                  <div className="text-sm text-gray-500">
                    Đang kiểm tra số container...
                  </div>
                )}
                {containerNumberWarning && (
                  <div id={`${containerId}-error`} className="text-sm text-yellow-600" role="alert">
                    {containerNumberWarning}
                  </div>
                )}
                {containerNumberError && (
                  <div id={`${containerId}-error`} className="text-sm text-red-500" role="alert">
                    {containerNumberError}
                  </div>
                )}
                {form.formState.errors.container_number && !containerNumberError && !containerNumberWarning && (
                  <div id={`${containerId}-error`} className="text-sm text-red-500" role="alert">
                    {form.formState.errors.container_number.message}
                  </div>
                )}
              </div>

              {/* Loại Container */}
              <div className="space-y-2">
                <Label htmlFor="container_type_id">Loại Container <span className="text-red-500">*</span></Label>
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

              {/* Hạn trả rỗng */}
              <div className="space-y-2">
                <Label htmlFor="available_from_datetime">Hạn Trả Rỗng <span className="text-red-500">*</span></Label>
                <Input
                  id="available_from_datetime"
                  type="datetime-local"
                  className="border-border focus:border-primary"
                  {...form.register('available_from_datetime')}
                />
                {form.formState.errors.available_from_datetime && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.available_from_datetime.message}
                  </p>
                )}
              </div>
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
                depotLabel="Depot/Địa điểm"
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Hình ảnh & Chứng từ
            </h3>
            
            {/* Container Condition Images */}
            <div className="space-y-3">
              <Label className="flex items-center text-base font-medium">
                <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                Hình ảnh tình trạng container
              </Label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm">
                  <ImageUploader
                  value={form.watch('condition_images') || []}
                  onChange={(urls) => form.setValue('condition_images', urls)}
                  userId={userId}
                  containerId={containerId}
                  maxFiles={5}
                  required={true}
                  label=""
                  description=""
                />
              </div>
              {form.formState.errors.condition_images && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.condition_images.message}
                </p>
              )}
            </div>

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
                  containerId={containerId}
                  maxFiles={10}
                  required={false}
                  label=""
                  description=""
                />
              </div>
            </div>
          </div>

          {/* Marketplace Option */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-text-primary border-b pb-2">
              Tùy chọn khác
            </h3>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg shadow-sm">
              <Checkbox
                id="is_listed_on_marketplace"
                {...form.register('is_listed_on_marketplace')}
              />
              <Label htmlFor="is_listed_on_marketplace" className="text-sm font-medium">
                Đăng lên Marketplace để tìm kiếm cơ hội Re-use
              </Label>
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
              className="bg-primary hover:bg-primary/90"
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