'use client'

import { useDashboardStore } from '@/stores/dashboard-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, TrendingUp, DollarSign, ArrowRightLeft, Container, Truck, MapPin } from 'lucide-react'

interface MatchSuggestion {
  import_container: any
  export_booking: any
  estimated_cost_saving: number
  estimated_co2_saving_kg: number
}

interface SuggestionLeaderboardProps {
  suggestions: MatchSuggestion[]
  importContainers: any[]
  exportBookings: any[]
}

export function SuggestionLeaderboard({ 
  suggestions, 
  importContainers, 
  exportBookings 
}: SuggestionLeaderboardProps) {
  const { selectedSuggestionId, setSelectedSuggestion, setSelectedDropOffOrder } = useDashboardStore()

  // Sắp xếp gợi ý theo điểm số hiệu quả (cost saving)
  const sortedSuggestions = suggestions
    .map((suggestion, index) => ({
      ...suggestion,
      id: `${suggestion.import_container.id}-${suggestion.export_booking.id}`,
      score: Math.round((suggestion.estimated_cost_saving / 10) + (suggestion.estimated_co2_saving_kg / 5))
    }))
    .sort((a, b) => b.score - a.score)

  const handleSuggestionClick = (suggestion: any) => {
    setSelectedSuggestion(suggestion.id)
    setSelectedDropOffOrder(suggestion.import_container.id)
  }

  if (sortedSuggestions.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-info" />
            Gợi ý Re-use
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-info/10">
              <RefreshCw className="h-8 w-8 text-info" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Chưa có Gợi Ý Ghép nối
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Thêm lệnh trả rỗng và lấy rỗng để có gợi ý Re-use
            </p>
            <div className="text-xs text-text-secondary space-y-1 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">Điều kiện ghép nối:</p>
              <ul className="text-left space-y-1">
                <li>• Cùng công ty vận tải</li>
                <li>• Cùng hãng tàu</li>
                <li>• Cùng loại container</li>
                <li>• Địa điểm gần nhau</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Bảng Xếp Hạng Gợi Ý
              </h2>
              <p className="text-sm text-text-secondary">
                {sortedSuggestions.length} cơ hội ghép nối được sắp xếp theo hiệu quả
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">
            {sortedSuggestions.length} gợi ý
          </Badge>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto h-[calc(100%-100px)] pr-2">
        {sortedSuggestions.map((suggestion, index) => (
          <Card 
            key={suggestion.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedSuggestionId === suggestion.id 
                ? 'bg-emerald-50 border-emerald-300 shadow-md ring-2 ring-emerald-200' 
                : 'hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Ranking Badge */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                    index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                    'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'
                  }`}>
                    #{index + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-medium">
                        Điểm: {suggestion.score}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Street-turn nội bộ
                      </Badge>
                    </div>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>

                  {/* Container Pairing */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Import Container */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Container className="w-3 h-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Giao trả</span>
                      </div>
                      <p className="font-semibold text-sm text-text-primary">
                        {suggestion.import_container.container_number}
                      </p>
                      <p className="text-xs text-blue-700 truncate">
                        {suggestion.import_container.drop_off_location || 'Depot'}
                      </p>
                    </div>

                    {/* Export Booking */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-3 h-3 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">Lấy rỗng</span>
                      </div>
                      <p className="font-semibold text-sm text-text-primary">
                        {suggestion.export_booking.booking_number}
                      </p>
                      <p className="text-xs text-orange-700 truncate">
                        {suggestion.export_booking.pick_up_location || 'Depot'}
                      </p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <DollarSign className="w-3 h-3" />
                        {suggestion.estimated_cost_saving.toLocaleString()}đ
                      </span>
                      <span className="text-blue-600 font-medium">
                        🌱 {suggestion.estimated_co2_saving_kg}kg CO₂
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary">
                      Click để xem chi tiết →
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}