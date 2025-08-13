'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRightLeft, Container, Truck, MapPin, DollarSign, Leaf, Clock, CheckCircle } from 'lucide-react'

interface SuggestionDetailsProps {
  suggestionId: string
  matchSuggestions: any[]
  importContainers: any[]
  exportBookings: any[]
}

export function SuggestionDetails({ 
  suggestionId, 
  matchSuggestions,
  importContainers,
  exportBookings 
}: SuggestionDetailsProps) {
  const suggestion = matchSuggestions.find(s => 
    `${s.import_container.id}-${s.export_booking.id}` === suggestionId
  )

  if (!suggestion) {
    return (
      <Card className="h-full">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="text-gray-500">Không tìm thấy gợi ý</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { import_container, export_booking, estimated_cost_saving, estimated_co2_saving_kg } = suggestion

  return (
    <div className="h-full overflow-hidden">
      <Card className="h-full p-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            Chi tiết Gợi ý
          </CardTitle>
          <p className="text-sm text-text-secondary">
            Thông tin chi tiết về cơ hội ghép nối
          </p>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto h-[calc(100%-100px)]">
          {/* Benefits Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Tiết kiệm Chi phí</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {estimated_cost_saving.toLocaleString()}đ
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Giảm CO₂</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {estimated_co2_saving_kg}kg
              </div>
            </div>
          </div>

          {/* Container Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-text-primary flex items-center gap-2">
              <Container className="w-4 h-4" />
              Container Giao Trả
            </h4>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-lg text-text-primary">
                    {import_container.container_number}
                  </div>
                  <Badge variant="outline" className="bg-white/80">
                    {import_container.container_type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-blue-700 font-medium mb-1">Depot trả rỗng</p>
                    <p className="text-text-primary">{import_container.drop_off_location || 'Chưa xác định'}</p>
                  </div>
                  <div>
                    <p className="text-blue-700 font-medium mb-1">Hạn trả rỗng</p>
                    <p className="text-text-primary">
                      {import_container.available_from_datetime 
                        ? new Date(import_container.available_from_datetime).toLocaleDateString('vi-VN')
                        : 'Linh hoạt'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-text-primary flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Lệnh Lấy Rỗng
            </h4>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-lg text-text-primary">
                    {export_booking.booking_number}
                  </div>
                  <Badge variant="outline" className="bg-white/80">
                    {export_booking.required_container_type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-orange-700 font-medium mb-1">Địa điểm lấy</p>
                    <p className="text-text-primary">{export_booking.pick_up_location || 'Chưa xác định'}</p>
                  </div>
                  <div>
                    <p className="text-orange-700 font-medium mb-1">Cần trước</p>
                    <p className="text-text-primary">
                      {export_booking.needed_by_datetime 
                        ? new Date(export_booking.needed_by_datetime).toLocaleDateString('vi-VN')
                        : 'Linh hoạt'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Matching Analysis */}
          <div className="space-y-4">
            <h4 className="font-semibold text-text-primary">Phân tích Ghép nối</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm text-text-secondary flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Loại container khớp
                </span>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  ✓ Khớp
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm text-text-secondary flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Cùng tổ chức
                </span>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  ✓ Khớp
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-text-secondary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Thời gian khả thi
                </span>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  Phù hợp
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Tạo Yêu cầu Street-turn
            </Button>
            <Button variant="outline" className="w-full">
              Xem chi tiết đầy đủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}