'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container, Truck, DollarSign, ArrowRightLeft } from 'lucide-react'

interface RelatedSuggestionsForDropOffOrderProps {
  orderId: string
  importContainers: any[]
  exportBookings: any[]
  matchSuggestions: any[]
}

export function RelatedSuggestionsForDropOffOrder({ 
  orderId, 
  importContainers,
  exportBookings,
  matchSuggestions 
}: RelatedSuggestionsForDropOffOrderProps) {
  const container = importContainers.find(c => c.id === orderId)
  const relatedSuggestions = matchSuggestions.filter(s => s.import_container.id === orderId)

  if (!container) {
    return (
      <Card className="h-full">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="text-gray-500">Không tìm thấy container</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <Card className="h-full p-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Container className="w-4 h-4 text-white" />
            </div>
            Gợi ý cho Container
          </CardTitle>
          <p className="text-sm text-text-secondary">
            {container.container_number}
          </p>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto h-[calc(100%-100px)]">
          {/* Container Info */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-text-primary">
                  {container.container_number}
                </div>
                <Badge variant="outline" className="bg-white/80">
                  {container.container_type}
                </Badge>
              </div>
              <div className="text-sm text-blue-700">
                <p>Depot trả rỗng: {container.drop_off_location || 'Chưa xác định'}</p>
                <p>Trạng thái: {container.status}</p>
              </div>
            </div>
          </div>

          {/* Related Suggestions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Lệnh lấy rỗng phù hợp ({relatedSuggestions.length})
            </h4>

            {relatedSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm">
                  Chưa có lệnh lấy rỗng phù hợp
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Thêm lệnh lấy rỗng cùng loại container để có gợi ý
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {relatedSuggestions.map((suggestion, index) => (
                  <Card key={index} className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-orange-600" />
                            <span className="font-medium text-text-primary">
                              {suggestion.export_booking.booking_number}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.export_booking.required_container_type}
                          </Badge>
                        </div>

                        <div className="text-sm text-orange-700">
                          <p>Lấy tại: {suggestion.export_booking.pick_up_location || 'Chưa xác định'}</p>
                          <p>Cần trước: {
                            suggestion.export_booking.needed_by_datetime 
                              ? new Date(suggestion.export_booking.needed_by_datetime).toLocaleDateString('vi-VN')
                              : 'Linh hoạt'
                          }</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-orange-200">
                          <div className="flex items-center gap-2 text-xs">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            <span className="text-green-600 font-medium">
                              {suggestion.estimated_cost_saving.toLocaleString()}đ
                            </span>
                          </div>
                          <div className="text-xs text-orange-600">
                            🌱 {suggestion.estimated_co2_saving_kg}kg CO₂
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <h5 className="font-medium text-text-primary text-sm">Mẹo tối ưu</h5>
            <div className="text-xs text-text-secondary space-y-1">
              <p>• Ưu tiên lệnh cùng hãng tàu và gần nhau</p>
              <p>• Kiểm tra chất lượng container trước khi ghép nối</p>
              <p>• Xem xét thời gian để tránh chậm trễ</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}