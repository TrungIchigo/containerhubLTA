'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { DropOffOrderGroup } from './DropOffOrderGroup'
import { createStreetTurnRequest } from '@/lib/actions/dispatcher'
import type { MatchSuggestion } from '@/components/dispatcher/types'

interface SuggestionsContainerProps {
  suggestions: MatchSuggestion[]
  onRequestCreated?: () => void
}

export function SuggestionsContainer({ suggestions, onRequestCreated }: SuggestionsContainerProps) {
  const [isCreatingRequest, setIsCreatingRequest] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleCreateRequest = async (dropOffOrderId: string, pickupOrderId: string) => {
    // Validation đầu vào
    if (!dropOffOrderId || !pickupOrderId) {
      setError('Thiếu thông tin ID đơn hàng')
      return
    }

    setIsCreatingRequest(true)
    setError(null)
    setSuccess(null)

    try {
      // Tìm thông tin chi tiết từ suggestions
      const suggestion = suggestions?.find(s => s?.import_container?.id === dropOffOrderId)
      const opportunity = suggestion?.export_bookings?.find(b => b?.id === pickupOrderId)
      
      if (!suggestion || !opportunity) {
        throw new Error('Không tìm thấy thông tin yêu cầu')
      }

      const result = await createStreetTurnRequest(
        dropOffOrderId,
        pickupOrderId,
        opportunity?.estimated_cost_saving ?? 0,
        opportunity?.estimated_co2_saving_kg ?? 0
      )

      if (result?.success) {
        setSuccess('Yêu cầu street-turn đã được tạo thành công!')
        onRequestCreated?.()
      } else {
        throw new Error(result?.message || 'Có lỗi xảy ra khi tạo yêu cầu')
      }
    } catch (error: unknown) {
      console.error('Error creating street-turn request:', error)
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo yêu cầu'
      setError(errorMessage)
    } finally {
      setIsCreatingRequest(false)
    }
  }

  // Tính toán thống kê tổng quan với xử lý an toàn
  const totalOpportunities = suggestions?.reduce((sum, s) => sum + (s?.export_bookings?.length ?? 0), 0) ?? 0
  const totalCostSaving = suggestions?.reduce((sum, s) => sum + (s?.total_estimated_cost_saving ?? 0), 0) ?? 0
  const totalCO2Saving = suggestions?.reduce((sum, s) => sum + (s?.total_estimated_co2_saving_kg ?? 0), 0) ?? 0

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gợi Ý Ghép Nối Street-turn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-4">Chưa có gợi ý ghép nối</p>
            <p className="mb-4">
              Hãy thêm lệnh trả rỗng và lệnh lấy rỗng để hệ thống tạo gợi ý Re-use container phù hợp.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header với thống kê tổng quan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gợi Ý Ghép Nối Street-turn</span>
            {isCreatingRequest && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo yêu cầu...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalOpportunities}</div>
              <div className="text-sm text-gray-600">Cơ hội ghép nối</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {totalCostSaving.toLocaleString()}đ
              </div>
              <div className="text-sm text-gray-600">Tiết kiệm chi phí</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {totalCO2Saving.toFixed(1)}kg
              </div>
              <div className="text-sm text-gray-600">Giảm CO₂</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông báo lỗi/thành công */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Danh sách các nhóm gợi ý */}
      <div className="space-y-4">
        {suggestions?.map((suggestion) => (
          suggestion?.import_container?.id ? (
            <DropOffOrderGroup
              key={suggestion.import_container.id}
              suggestion={suggestion}
              onCreateRequest={handleCreateRequest}
            />
          ) : null
        ))}
      </div>
    </div>
  )
}