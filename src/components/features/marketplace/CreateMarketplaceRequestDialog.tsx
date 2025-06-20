'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, MapPin, Calendar, Truck } from 'lucide-react'
import { createMarketplaceRequest, getUserExportBookings } from '@/lib/actions/marketplace'
import { useToast } from '@/hooks/use-toast'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { MarketplaceListing } from '@/lib/types'

// Interface cho booking data từ API
interface BookingData {
  id: string
  booking_number: string
  required_container_type: string
  pick_up_location: string
  needed_by_datetime: string
}

interface CreateMarketplaceRequestDialogProps {
  listing: MarketplaceListing
  isOpen: boolean
  onClose: () => void
}

export default function CreateMarketplaceRequestDialog({ 
  listing, 
  isOpen, 
  onClose 
}: CreateMarketplaceRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [availableBookings, setAvailableBookings] = useState<BookingData[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const { toast } = useToast()

  const loadExportBookings = useCallback(async () => {
    try {
      setLoadingBookings(true)
      const rawBookings = await getUserExportBookings()
      
      // Transform và filter compatible bookings
      const compatibleBookings: BookingData[] = rawBookings
        .filter(booking => booking.required_container_type === listing.container_type)
        .map(booking => ({
          id: booking.id,
          booking_number: booking.booking_number,
          required_container_type: booking.required_container_type,
          pick_up_location: booking.pick_up_location,
          needed_by_datetime: booking.needed_by_datetime
        }))
      
      setAvailableBookings(compatibleBookings)
    } catch (error) {
      console.error('Error loading bookings:', error)
      setErrorMessage('Không thể tải danh sách lệnh lấy rỗng.')
    } finally {
      setLoadingBookings(false)
    }
  }, [listing.container_type])

  // Load bookings khi dialog mở
  useEffect(() => {
    if (isOpen) {
      loadExportBookings()
      setSelectedBookingId('')
      setErrorMessage('')
    }
  }, [isOpen, loadExportBookings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage('')

    if (!selectedBookingId) {
      setErrorMessage('Vui lòng chọn một lệnh lấy rỗng.')
      setIsLoading(false)
      return
    }

    try {
      await createMarketplaceRequest({
        dropoff_container_id: listing.id,
        pickup_booking_id: selectedBookingId,
        estimated_cost_saving: 150,
        estimated_co2_saving_kg: 25
      })

      toast({
        title: "🎉 Yêu cầu đã được gửi!",
        description: "Yêu cầu ghép nối đã được gửi đến công ty cung cấp để xem xét.",
        variant: 'default',
        duration: 5000,
      })

      onClose()
    } catch (error: any) {
      console.error('Error creating marketplace request:', error)
      setErrorMessage(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedBooking = availableBookings.find(b => b.id === selectedBookingId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-text-primary">
            Tạo Yêu Cầu Ghép Nối Marketplace
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Container Info Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
            <h3 className="text-sm font-medium text-text-primary mb-3">
              Lệnh Giao Trả được chọn:
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Container:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{listing.container_type}</Badge>
                  <span className="font-medium">{listing.container_number}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Công ty:</span>
                <span className="text-sm">{listing.trucking_company.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Địa điểm:</span>
                <span className="text-sm">{listing.drop_off_location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Thời gian rảnh:</span>
                <span className="text-sm">{formatStoredDateTimeVN(listing.available_from_datetime)}</span>
              </div>
            </div>
          </div>

          {/* Select Export Booking */}
          <div className="space-y-3">
            <Label htmlFor="booking_selection">
              Chọn Lệnh Lấy Rỗng của bạn để ghép nối:
            </Label>
            
            {loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-text-secondary">Đang tải...</span>
              </div>
            ) : availableBookings.length === 0 ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md shadow-sm">
                <p className="text-sm text-text-secondary">
                  Không có lệnh lấy rỗng nào phù hợp (cùng loại container {listing.container_type}).
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Vui lòng tạo lệnh lấy rỗng trước khi sử dụng marketplace.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableBookings.map((booking) => (
                  <label
                    key={booking.id}
                    className={`flex items-center p-3 border rounded-md shadow-sm cursor-pointer transition-colors ${
                      selectedBookingId === booking.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="booking_selection"
                      value={booking.id}
                      checked={selectedBookingId === booking.id}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-text-secondary" />
                          <span className="font-medium text-text-primary">
                            {booking.booking_number}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {booking.required_container_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-text-secondary">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.pick_up_location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Cần trước: {formatStoredDateTimeVN(booking.needed_by_datetime)}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Route Preview */}
          {selectedBooking && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md shadow-sm">
              <h3 className="text-sm font-medium text-text-primary mb-3">
                Xem trước lộ trình ghép nối:
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <div className="text-center">
                  <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
                  <div className="font-medium">{listing.drop_off_location}</div>
                  <div className="text-text-secondary text-xs">Điểm giao trả</div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-text-secondary" />
                
                <div className="text-center">
                  <MapPin className="w-4 h-4 text-danger mx-auto mb-1" />
                  <div className="font-medium">{selectedBooking.pick_up_location}</div>
                  <div className="text-text-secondary text-xs">Điểm lấy hàng</div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-green-300">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-text-secondary">Ước tính tiết kiệm:</span>
                    <div className="font-medium text-green-600">$150 • 25kg CO₂</div>
                  </div>
                  <div>
                    <span className="text-text-secondary">Loại ghép:</span>
                    <div className="font-medium">Marketplace (Chéo công ty)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 text-sm text-danger bg-red-50 border border-red-200 rounded-md shadow-sm">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={isLoading || !selectedBookingId || availableBookings.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                'Gửi Yêu Cầu'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 