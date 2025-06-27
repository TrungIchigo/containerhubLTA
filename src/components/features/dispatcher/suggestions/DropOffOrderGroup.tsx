import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Container, Ship, TrendingUp } from 'lucide-react'
import { OpportunityRow } from "./OpportunityRow"
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { StreetTurnSuggestionGroup } from '@/lib/types'

interface DropOffOrderGroupProps {
  group: StreetTurnSuggestionGroup
  onUpdate?: () => void
}

export function DropOffOrderGroup({ group, onUpdate }: DropOffOrderGroupProps) {
  const { dropOffOrder, matchingOpportunities } = group
  
  // Tìm điểm cao nhất và thấp nhất
  const bestScore = Math.max(...matchingOpportunities.map(op => op.overallScore))
  const averageScore = matchingOpportunities.reduce((sum, op) => sum + op.overallScore, 0) / matchingOpportunities.length
  
  // Đếm số lượng cơ hội theo mức độ
  const excellentCount = matchingOpportunities.filter(op => op.overallScore >= 85).length
  const goodCount = matchingOpportunities.filter(op => op.overallScore >= 70 && op.overallScore < 85).length
  const fairCount = matchingOpportunities.filter(op => op.overallScore >= 50 && op.overallScore < 70).length

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 p-2">
            <div className="p-3 bg-blue-100 rounded-full">
              <Container className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="font-bold">{dropOffOrder.container_number}</span>
                <Badge variant="secondary">{dropOffOrder.container_type}</Badge>
              </CardTitle>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Giao tại: {dropOffOrder.drop_off_location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Sẵn sàng: {formatStoredDateTimeVN(dropOffOrder.available_from_datetime)}</span>
                </div>
                {dropOffOrder.shipping_line_org_id && (
                  <div className="flex items-center gap-1">
                    <Ship className="h-3 w-3" />
                    <span>Hãng tàu</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Thống kê tóm tắt */}
          <div className="text-right p-2">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">{bestScore.toFixed(0)}</span>
              <span className="text-sm text-gray-600">cao nhất</span>
            </div>
            <div className="text-sm text-gray-600">
              Trung bình: {averageScore.toFixed(1)} • {matchingOpportunities.length} cơ hội
            </div>
            <div className="flex gap-1 mt-1">
              {excellentCount > 0 && (
                <Badge variant="default" className="text-xs">
                  {excellentCount} xuất sắc
                </Badge>
              )}
              {goodCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {goodCount} tốt
                </Badge>
              )}
              {fairCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {fairCount} khá
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Danh sách các cơ hội */}
        <div className="divide-y divide-gray-100">
          {matchingOpportunities.map((opportunity, index) => (
            <div key={`${dropOffOrder.id}-${opportunity.pickupOrder.id}`} className="relative">
              {/* Chỉ số thứ tự */}
              <div className="absolute left-2 top-4 z-10">
                <div className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
              <div className="pl-10">
                <OpportunityRow 
                  opportunity={opportunity} 
                  dropOffOrder={dropOffOrder}
                  onUpdate={onUpdate}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer với thống kê chi tiết */}
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-green-600">{excellentCount}</div>
              <div className="text-gray-600">Cơ hội vàng (85+)</div>
            </div>
            <div>
              <div className="font-semibold text-blue-600">{goodCount}</div>
              <div className="text-gray-600">Cơ hội tốt (70-84)</div>
            </div>
            <div>
              <div className="font-semibold text-yellow-600">{fairCount}</div>
              <div className="text-gray-600">Cơ hội khá (50-69)</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 