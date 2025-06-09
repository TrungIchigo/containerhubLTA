'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { addImportContainer } from '@/lib/actions/dispatcher'
import type { Organization } from '@/lib/types'

interface AddImportContainerFormProps {
  shippingLines: Organization[]
}

export default function AddImportContainerForm({ shippingLines }: AddImportContainerFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    container_number: '',
    container_type: '20FT',
    drop_off_location: '',
    available_from_datetime: '',
    shipping_line_org_id: ''
  })

  const containerTypes = [
    { value: '20FT', label: '20FT' },
    { value: '40FT', label: '40FT' },
    { value: '40HQ', label: '40HQ' },
    { value: '45FT', label: '45FT' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    // Validation
    if (!formData.container_number || !formData.drop_off_location || 
        !formData.available_from_datetime || !formData.shipping_line_org_id) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin.')
      setIsLoading(false)
      return
    }

    try {
      await addImportContainer(formData)
      
      // Reset form and close dialog
      setFormData({
        container_number: '',
        container_type: '20FT',
        drop_off_location: '',
        available_from_datetime: '',
        shipping_line_org_id: ''
      })
      setIsOpen(false)
    } catch (error: any) {
      console.error('Error adding container:', error)
      setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-dark text-white">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Container Nhập
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Thêm Container Nhập Khẩu</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Số Container */}
          <div className="space-y-2">
            <Label htmlFor="container_number">Số Container</Label>
            <Input
              id="container_number"
              name="container_number"
              type="text"
              value={formData.container_number}
              onChange={handleInputChange}
              placeholder="ABCU1234567"
              className="border-border focus:border-primary"
              required
            />
          </div>

          {/* Loại Container */}
          <div className="space-y-2">
            <Label htmlFor="container_type">Loại Container</Label>
            <select
              id="container_type"
              name="container_type"
              value={formData.container_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            >
              {containerTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hãng Tàu */}
          <div className="space-y-2">
            <Label htmlFor="shipping_line_org_id">Hãng Tàu</Label>
            <select
              id="shipping_line_org_id"
              name="shipping_line_org_id"
              value={formData.shipping_line_org_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Chọn hãng tàu</option>
              {shippingLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>

          {/* Địa Điểm Dỡ Hàng */}
          <div className="space-y-2">
            <Label htmlFor="drop_off_location">Địa Điểm Dỡ Hàng</Label>
            <Input
              id="drop_off_location"
              name="drop_off_location"
              type="text"
              value={formData.drop_off_location}
              onChange={handleInputChange}
              placeholder="Cảng Cát Lái, TP.HCM"
              className="border-border focus:border-primary"
              required
            />
          </div>

          {/* Thời Gian Rảnh */}
          <div className="space-y-2">
            <Label htmlFor="available_from_datetime">Thời Gian Rảnh</Label>
            <Input
              id="available_from_datetime"
              name="available_from_datetime"
              type="datetime-local"
              value={formData.available_from_datetime}
              onChange={handleInputChange}
              className="border-border focus:border-primary"
              required
            />
          </div>

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="p-3 text-sm text-danger bg-red-50 border border-red-200 rounded-md">
              {errorMessage}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
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
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={isLoading}
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