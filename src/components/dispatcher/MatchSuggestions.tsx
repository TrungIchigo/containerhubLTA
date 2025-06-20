'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, Leaf, MapPin, ArrowRight, Calculator, Clock } from 'lucide-react'
import { createStreetTurnRequest } from '@/lib/actions/dispatcher'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { ImportContainer, ExportBooking } from '@/lib/types'

interface MatchSuggestion {
  import_container: ImportContainer & {
    shipping_line?: { name: string }
  }
  export_booking: ExportBooking
  estimated_cost_saving: number
  estimated_co2_saving_kg: number
}

interface MatchSuggestionsProps {
  suggestions: MatchSuggestion[]
}

export default function MatchSuggestions({ suggestions }: MatchSuggestionsProps) {
  const [loadingRequests, setLoadingRequests] = useState<string[]>([])

  const handleCreateRequest = async (suggestion: MatchSuggestion) => {
    const requestId = `${suggestion.import_container.id}-${suggestion.export_booking.id}`
    setLoadingRequests(prev => [...prev, requestId])

    try {
      const result = await createStreetTurnRequest(
        suggestion.import_container.id,
        suggestion.export_booking.id,
        suggestion.estimated_cost_saving,
        suggestion.estimated_co2_saving_kg
      )
      
      if (result?.success) {
        console.log('Request created successfully:', result.message)
        // You could add a toast notification here
      }
      
    } catch (error: any) {
      console.error('Error creating request:', error)
      alert(`Lỗi tạo yêu cầu: ${error.message || 'Unknown error'}`)
    } finally {
      setLoadingRequests(prev => prev.filter(id => id !== requestId))
    }
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
            <div className="text-sm mt-4 space-y-2">
              <p className="font-medium">Điều kiện để có gợi ý ghép nối:</p>
              <ul className="text-left max-w-md mx-auto space-y-1">
                <li>• Cùng công ty vận tải (ghép nối nội bộ)</li>
                <li>• Cùng hãng tàu</li>
                <li>• Cùng thành phố (trả và lấy)</li>
                <li>• Cùng loại container</li>
                <li>• Khoảng cách thời gian tối thiểu 2 giờ</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-text-primary">Lệnh Giao Trả</th>
                <th className="text-left p-3 font-medium text-text-primary">Lệnh Lấy Rỗng</th>
                <th className="text-left p-3 font-medium text-text-primary">Lợi ích Ước tính</th>
                <th className="text-center p-3 font-medium text-text-primary">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion) => {
                const requestId = `${suggestion.import_container.id}-${suggestion.export_booking.id}`
                const isLoading = loadingRequests.includes(requestId)
                
                return (
                  <tr key={requestId} className="border-b border-border hover:bg-gray-50">
                    {/* Lệnh Giao Trả */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-medium text-text-primary">
                          {suggestion.import_container.container_number}
                        </div>
                        <div className="text-sm text-text-secondary">
                          <Badge variant="outline" className="mr-2">
                            {suggestion.import_container.container_type}
                          </Badge>
                          {suggestion.import_container.shipping_line?.name}
                        </div>
                        <div className="text-xs text-text-secondary">
                          📍 {suggestion.import_container.drop_off_location}
                        </div>
                        <div className="text-xs text-text-secondary">
                          🕒 Rảnh từ: {formatStoredDateTimeVN(suggestion.import_container.available_from_datetime)}
                        </div>
                        <div className="text-xs text-blue-600">
                          🏙️ Cùng thành phố • 🚢 Cùng hãng tàu
                        </div>
                      </div>
                    </td>

                    {/* Lệnh Lấy Rỗng */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-medium text-text-primary">
                          {suggestion.export_booking.booking_number}
                        </div>
                        <div className="text-sm text-text-secondary">
                          <Badge variant="outline" className="mr-2">
                            {suggestion.export_booking.required_container_type}
                          </Badge>
                        </div>
                        <div className="text-xs text-text-secondary">
                          📍 {suggestion.export_booking.pick_up_location}
                        </div>
                        <div className="text-xs text-text-secondary">
                          🕒 Cần trước: {formatStoredDateTimeVN(suggestion.export_booking.needed_by_datetime)}
                        </div>
                        <div className="text-xs text-green-600">
                          {(() => {
                            const containerTime = new Date(suggestion.import_container.available_from_datetime)
                            const bookingTime = new Date(suggestion.export_booking.needed_by_datetime)
                            const diffHours = Math.round((bookingTime.getTime() - containerTime.getTime()) / (1000 * 60 * 60))
                            return `⏱️ Khoảng cách: ${diffHours} giờ`
                          })()}
                        </div>
                      </div>
                    </td>

                    {/* Lợi ích */}
                    <td className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">
                            ${suggestion.estimated_cost_saving}
                          </span>
                        </div>
                        <div className="flex items-center text-emerald-600">
                          <Leaf className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">
                            {suggestion.estimated_co2_saving_kg}kg CO₂
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Hành động */}
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary-dark text-white"
                        onClick={() => handleCreateRequest(suggestion)}
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 