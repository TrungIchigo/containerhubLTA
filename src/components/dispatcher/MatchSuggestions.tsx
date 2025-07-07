'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, ChevronDown, ChevronUp, Calculator, Leaf, TrendingUp,
  Container, MapPin, Clock, ChevronRight
} from 'lucide-react'
import { createStreetTurnRequest } from '@/lib/actions/dispatcher'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ImportContainer, ExportBooking } from '@/lib/types'
import type { MatchSuggestion } from './types'
import MatchingSummary from './MatchingSummary'
import MatchingScoreBar from './MatchingScoreBar'
import ScoreCircle from './ScoreCircle'

interface ExtendedImportContainer extends ImportContainer {
  shipping_line?: {
    id: string
    name: string
  }
}

interface ExtendedExportBooking extends ExportBooking {
  matching_score: {
    total_score: number
    distance_score: number
    time_score: number
    complexity_score: number
    quality_score: number
  }
  scenario_type?: string
  additional_fees?: Array<{
    type: string
    amount: number
  }>
  estimated_cost_saving: number
  estimated_co2_saving_kg: number
  required_actions?: string[]
}

interface Suggestion {
  import_container: ExtendedImportContainer
  export_bookings: ExtendedExportBooking[]
  total_estimated_cost_saving: number
  total_estimated_co2_saving_kg: number
}

interface MatchSuggestionsProps {
  initialSuggestions: MatchSuggestion[]
}

function OrderNumber({ number }: { number: number }) {
  return (
    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
      {number}
    </div>
  )
}

export default function MatchSuggestions({ initialSuggestions }: MatchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [loadingRequests, setLoadingRequests] = useState<string[]>([])
  const [expandedSuggestions, setExpandedSuggestions] = useState<string[]>([])
  const [expandedBookings, setExpandedBookings] = useState<string[]>([])

  const handleCreateRequest = async (importContainer: ExtendedImportContainer, exportBooking: ExtendedExportBooking, costSaving: number, co2Saving: number) => {
    const requestId = `${importContainer.id}-${exportBooking.id}`
    setLoadingRequests(prev => [...prev, requestId])

    try {
      const result = await createStreetTurnRequest(
        importContainer.id,
        exportBooking.id,
        costSaving,
        co2Saving
      )
      
      if (result?.success) {
        console.log('Request created successfully:', result.message)
      }
      
    } catch (error: any) {
      console.error('Error creating request:', error)
      alert(`Lỗi tạo yêu cầu: ${error.message || 'Unknown error'}`)
    } finally {
      setLoadingRequests(prev => prev.filter(id => id !== requestId))
    }
  }

  const toggleExpand = (containerId: string) => {
    setExpandedSuggestions(prev => 
      prev.includes(containerId) 
        ? prev.filter(id => id !== containerId)
        : [...prev, containerId]
    )
  }

  const toggleBookingExpand = (bookingId: string) => {
    setExpandedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-text-primary">Gợi Ý Ghép Nối Nội Bộ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-text-secondary">
            <p className="text-lg font-medium mb-4">Chưa có Gợi Ý Ghép nối</p>
            <p className="mb-4">Hãy thêm lệnh giao trả và lệnh lấy rỗng để hệ thống tạo gợi ý tái sử dụng container phù hợp.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <MatchingSummary suggestions={suggestions} />
      
      <div className="space-y-4">
        {suggestions.map((suggestion) => {
          const isExpanded = expandedSuggestions.includes(suggestion.import_container.id)
          const maxScore = Math.max(...suggestion.export_bookings.map(b => b.matching_score.total_score))
          
          // Count bookings by score range
          const goodBookings = suggestion.export_bookings.filter(b => b.matching_score.total_score >= 70 && b.matching_score.total_score < 85).length
          const fairBookings = suggestion.export_bookings.filter(b => b.matching_score.total_score >= 50 && b.matching_score.total_score < 70).length
          
          return (
            <Card key={suggestion.import_container.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Container Info */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Container className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="font-mono">
                            {suggestion.import_container.container_number}
                          </Badge>
                          <Badge>{suggestion.import_container.container_type}</Badge>
                          <span className="text-sm text-gray-600">{suggestion.import_container.shipping_line?.name}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>Giao tại: {suggestion.import_container.drop_off_location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>Sẵn sàng: {formatStoredDateTimeVN(suggestion.import_container.available_from_datetime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600 mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">{maxScore}</span>
                        <span className="text-xs">cao nhất</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {goodBookings > 0 && <span>{goodBookings} tốt</span>}
                        {goodBookings > 0 && fairBookings > 0 && <span> • </span>}
                        {fairBookings > 0 && <span>{fairBookings} khá</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking List */}
                <div className="divide-y">
                  {suggestion.export_bookings.map((booking, index) => {
                    const requestId = `${suggestion.import_container.id}-${booking.id}`
                    const isLoading = loadingRequests.includes(requestId)
                    const isBookingExpanded = expandedBookings.includes(booking.id)

                    return (
                      <div 
                        key={booking.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <OrderNumber number={index + 1} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex-shrink-0">
                                    <ScoreCircle score={booking.matching_score.total_score} />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      Lệnh: {booking.booking_number}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {booking.scenario_type || 'Street-turn Nội bộ Trên Đường'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-sm text-gray-600 space-y-1 mb-2">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span>Lấy tại: {booking.pick_up_location}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>Cần vào: {formatStoredDateTimeVN(booking.needed_by_datetime)}</span>
                                  </div>
                                  {booking.additional_fees?.map(fee => (
                                    <div key={fee.type} className="text-red-600 flex items-center gap-2">
                                      <span>💰</span>
                                      <span>Chi phí phát sinh: {fee.amount.toLocaleString()} VND</span>
                                    </div>
                                  ))}
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleBookingExpand(booking.id)}
                                  className="text-sm"
                                >
                                  {isBookingExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Thu gọn chi tiết
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      Xem chi tiết
                                    </>
                                  )}
                                </Button>
                              </div>

                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary-dark text-white"
                                onClick={() => handleCreateRequest(
                                  suggestion.import_container,
                                  booking,
                                  booking.estimated_cost_saving,
                                  booking.estimated_co2_saving_kg
                                )}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Đang tạo...
                                  </>
                                ) : (
                                  'Tạo Yêu Cầu'
                                )}
                              </Button>
                            </div>

                            {isBookingExpanded && (
                              <div className="mt-4 grid grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                    <Calculator className="h-4 w-4" />
                                    Phân Tích Điểm Số
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600 w-24">Khoảng cách:</span>
                                      <MatchingScoreBar 
                                        score={booking.matching_score.distance_score} 
                                        maxScore={40}
                                        color="bg-blue-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600 w-24">Thời gian:</span>
                                      <MatchingScoreBar 
                                        score={booking.matching_score.time_score} 
                                        maxScore={20}
                                        color="bg-green-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600 w-24">Độ phức tạp:</span>
                                      <MatchingScoreBar 
                                        score={booking.matching_score.complexity_score} 
                                        maxScore={15}
                                        color="bg-yellow-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600 w-24">Chất lượng & Uy tín:</span>
                                      <MatchingScoreBar 
                                        score={booking.matching_score.quality_score} 
                                        maxScore={25}
                                        color="bg-purple-500"
                                      />
                                    </div>
                                    <div className="pt-2 border-t">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium w-24">Tổng điểm:</span>
                                        <span className="text-lg font-semibold">
                                          {booking.matching_score.total_score.toFixed(1)}/100
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                    <Leaf className="h-4 w-4" />
                                    Chi Tiết Kịch Bản
                                  </h4>
                                  <div className="space-y-2">
                                    <div>
                                      <div className="text-sm font-medium mb-1">Loại kịch bản:</div>
                                      <div className="text-sm text-gray-600">
                                        {booking.scenario_type || 'Street-turn Nội bộ Trên Đường'}
                                      </div>
                                    </div>
                                    {booking.required_actions && booking.required_actions.length > 0 && (
                                      <div>
                                        <div className="text-sm font-medium mb-1">Tác vụ cần thực hiện:</div>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                          {booking.required_actions.map((action, i) => (
                                            <li key={i} className="flex items-center gap-1">
                                              <ChevronRight className="h-4 w-4 text-yellow-500" />
                                              {action}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {booking.additional_fees && booking.additional_fees.length > 0 && (
                                      <div>
                                        <div className="text-sm font-medium mb-1">Chi phí phát sinh:</div>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                          {booking.additional_fees.map((fee, i) => (
                                            <li key={i} className="flex items-center justify-between">
                                              <span>{fee.type}:</span>
                                              <span className="font-medium text-red-600">
                                                {fee.amount.toLocaleString()} VND
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
} 