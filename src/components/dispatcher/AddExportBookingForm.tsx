'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { addExportBooking } from '@/lib/actions/dispatcher'

export default function AddExportBookingForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState({
    booking_number: '',
    required_container_type: '20FT',
    pick_up_location: '',
    needed_by_datetime: ''
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
    if (!formData.booking_number || !formData.pick_up_location || !formData.needed_by_datetime) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin.')
      setIsLoading(false)
      return
    }

    try {
      await addExportBooking(formData)
      
      // Reset form and close dialog
      setFormData({
        booking_number: '',
        required_container_type: '20FT',
        pick_up_location: '',
        needed_by_datetime: ''
      })
      setIsOpen(false)
    } catch (error: any) {
      console.error('Error adding booking:', error)
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
          Thêm Booking Xuất
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Thêm Booking Xuất Khẩu</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Số Booking */}
          <div className="space-y-2">
            <Label htmlFor="booking_number">Số Booking</Label>
            <Input
              id="booking_number"
              name="booking_number"
              type="text"
              value={formData.booking_number}
              onChange={handleInputChange}
              placeholder="BKG123456789"
              className="border-border focus:border-primary"
              required
            />
          </div>

          {/* Loại Container Yêu Cầu */}
          <div className="space-y-2">
            <Label htmlFor="required_container_type">Loại Container Yêu Cầu</Label>
            <select
              id="required_container_type"
              name="required_container_type"
              value={formData.required_container_type}
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

          {/* Địa Điểm Lấy Hàng */}
          <div className="space-y-2">
            <Label htmlFor="pick_up_location">Địa Điểm Lấy Hàng</Label>
            <Input
              id="pick_up_location"
              name="pick_up_location"
              type="text"
              value={formData.pick_up_location}
              onChange={handleInputChange}
              placeholder="Cảng Cát Lái, TP.HCM"
              className="border-border focus:border-primary"
              required
            />
          </div>

          {/* Thời Gian Cần */}
          <div className="space-y-2">
            <Label htmlFor="needed_by_datetime">Thời Gian Cần</Label>
            <Input
              id="needed_by_datetime"
              name="needed_by_datetime"
              type="datetime-local"
              value={formData.needed_by_datetime}
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