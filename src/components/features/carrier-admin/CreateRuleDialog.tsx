'use client'

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Settings, Container, Building2, MapPin, X, Info } from 'lucide-react'
import { 
  createAutoApprovalRule, 
  getTruckingCompanies 
} from '@/lib/actions/auto-approval'
import { CreateRuleFormData } from '@/lib/types/auto-approval'
import { useToast } from '@/hooks/use-toast'

interface CreateRuleDialogProps {
  children: React.ReactNode
}

const CONTAINER_TYPES = ['20FT', '40FT', '40HC', '45FT']

export default function CreateRuleDialog({ children }: CreateRuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [truckingCompanies, setTruckingCompanies] = useState<any[]>([])
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    getValues
  } = useForm<CreateRuleFormData>({
    defaultValues: {
      name: '',
      description: '',
      priority: 100,
      is_active: true,
      conditions: {
        containerTypes: [],
        allowedTruckingCos: [],
        maxDistanceKm: 30,
        applyToAllTruckingCos: true,
        hasDistanceLimit: false
      }
    }
  })

  const watchApplyToAll = watch('conditions.applyToAllTruckingCos')
  const watchHasDistanceLimit = watch('conditions.hasDistanceLimit')
  const watchContainerTypes = watch('conditions.containerTypes')
  const watchAllowedCompanies = watch('conditions.allowedTruckingCos')

  useEffect(() => {
    if (open) {
      loadTruckingCompanies()
    }
  }, [open])

  const loadTruckingCompanies = async () => {
    try {
      const companies = await getTruckingCompanies()
      setTruckingCompanies(companies)
    } catch (error) {
      console.error('Error loading trucking companies:', error)
    }
  }

  const onSubmit = async (data: CreateRuleFormData) => {
    setIsLoading(true)
    try {
      await createAutoApprovalRule(data)
      toast({
        title: 'Thành công',
        description: 'Quy tắc mới đã được tạo.',
      })
      setOpen(false)
      reset()
    } catch (error) {
      console.error('Error creating rule:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo quy tắc mới.',
        variant: 'destructive',
      })
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

  const toggleContainerType = (type: string) => {
    const current = getValues('conditions.containerTypes')
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type]
    setValue('conditions.containerTypes', updated)
  }

  const toggleTruckingCompany = (companyId: string) => {
    const current = getValues('conditions.allowedTruckingCos')
    const updated = current.includes(companyId)
      ? current.filter(id => id !== companyId)
      : [...current, companyId]
    setValue('conditions.allowedTruckingCos', updated)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Tạo Quy tắc Phê duyệt Tự động
            </DialogTitle>
            <DialogDescription>
              Thiết lập điều kiện để hệ thống tự động phê duyệt các yêu cầu Re-use container phù hợp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thông tin Cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    Tên Quy tắc <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ví dụ: Tự động duyệt 40HC nội thành"
                    {...register('name', {
                      required: 'Tên quy tắc là bắt buộc',
                      minLength: {
                        value: 5,
                        message: 'Tên quy tắc phải có ít nhất 5 ký tự'
                      }
                    })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về quy tắc này..."
                    className="min-h-[80px]"
                    {...register('description')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">
                      Độ ưu tiên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="priority"
                      type="number"
                      min="1"
                      max="1000"
                      {...register('priority', {
                        required: 'Độ ưu tiên là bắt buộc',
                        min: { value: 1, message: 'Độ ưu tiên tối thiểu là 1' },
                        max: { value: 1000, message: 'Độ ưu tiên tối đa là 1000' }
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Số nhỏ hơn = ưu tiên cao hơn
                    </p>
                    {errors.priority && (
                      <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is_active"
                      checked={watch('is_active')}
                      onCheckedChange={(checked) => setValue('is_active', checked)}
                    />
                    <Label htmlFor="is_active">Kích hoạt ngay</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Điều kiện Áp dụng
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Tất cả điều kiện phải được thỏa mãn để quy tắc được áp dụng
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Container Types */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Container className="w-4 h-4" />
                    Loại Container
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CONTAINER_TYPES.map((type) => (
                      <Badge
                        key={type}
                        variant={watchContainerTypes.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleContainerType(type)}
                      >
                        {type}
                        {watchContainerTypes.includes(type) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Chọn loại container mà quy tắc sẽ áp dụng
                  </p>
                </div>

                <Separator />

                {/* Trucking Companies */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4" />
                    Đối tác Vận tải
                  </Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="applyToAll"
                        checked={watchApplyToAll}
                        onCheckedChange={(checked) => {
                          setValue('conditions.applyToAllTruckingCos', checked)
                          if (checked) {
                            setValue('conditions.allowedTruckingCos', [])
                          }
                        }}
                      />
                      <Label htmlFor="applyToAll">Áp dụng cho tất cả công ty vận tải</Label>
                    </div>

                    {!watchApplyToAll && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Chọn các công ty được phép:
                        </Label>
                        <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                          {truckingCompanies.map((company) => (
                            <div
                              key={company.id}
                              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                              onClick={() => toggleTruckingCompany(company.id)}
                            >
                              <input
                                type="checkbox"
                                checked={watchAllowedCompanies.includes(company.id)}
                                onChange={() => toggleTruckingCompany(company.id)}
                                className="rounded"
                              />
                              <span className="text-sm">{company.name}</span>
                            </div>
                          ))}
                        </div>
                        {watchAllowedCompanies.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Đã chọn {watchAllowedCompanies.length} công ty
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Distance Limit */}
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4" />
                    Giới hạn Địa lý
                  </Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hasDistanceLimit"
                        checked={watchHasDistanceLimit}
                        onCheckedChange={(checked) => setValue('conditions.hasDistanceLimit', checked)}
                      />
                      <Label htmlFor="hasDistanceLimit">Giới hạn khoảng cách</Label>
                    </div>

                    {watchHasDistanceLimit && (
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm">Tối đa:</Label>
                        <Input
                          type="number"
                          min="1"
                          max="1000"
                          className="w-20"
                          {...register('conditions.maxDistanceKm', {
                            min: { value: 1, message: 'Tối thiểu 1km' },
                            max: { value: 1000, message: 'Tối đa 1000km' }
                          })}
                        />
                        <Label className="text-sm">km</Label>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Khoảng cách giữa điểm dỡ hàng và điểm lấy hàng
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex gap-2">
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
              disabled={isLoading || watchContainerTypes.length === 0}
            >
              {isLoading ? 'Đang tạo...' : 'Tạo Quy tắc'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}