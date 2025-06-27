import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, Award, Target, AlertCircle } from 'lucide-react'
import { DropOffOrderGroup } from './DropOffOrderGroup'
import type { StreetTurnSuggestionGroup } from '@/lib/types'

interface SuggestionsContainerProps {
  suggestionGroups: StreetTurnSuggestionGroup[]
  onUpdate?: () => void
}

export function SuggestionsContainer({ suggestionGroups, onUpdate }: SuggestionsContainerProps) {
  if (!suggestionGroups || suggestionGroups.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Không có gợi ý ghép nối
          </h3>
          <p className="text-gray-600">
            Hiện tại không có cặp container và booking nào phù hợp để thực hiện street-turn.
            <br />
            Hãy kiểm tra lại dữ liệu hoặc thử lại sau.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Tính toán thống kê tổng quan
  const totalContainers = suggestionGroups.length
  const totalOpportunities = suggestionGroups.reduce((sum, group) => sum + group.matchingOpportunities.length, 0)
  
  // Tính toán các loại cơ hội
  const allOpportunities = suggestionGroups.flatMap(group => group.matchingOpportunities)
  const excellentOpportunities = allOpportunities.filter(op => op.overallScore >= 85).length
  const goodOpportunities = allOpportunities.filter(op => op.overallScore >= 70 && op.overallScore < 85).length
  const fairOpportunities = allOpportunities.filter(op => op.overallScore >= 50 && op.overallScore < 70).length
  const poorOpportunities = allOpportunities.filter(op => op.overallScore < 50).length
  
  // Tìm điểm số cao nhất
  const highestScore = Math.max(...allOpportunities.map(op => op.overallScore))
  const averageScore = allOpportunities.reduce((sum, op) => sum + op.overallScore, 0) / totalOpportunities
  
  // Tìm container có nhiều cơ hội nhất
  const mostOpportunitiesContainer = suggestionGroups.reduce((max, group) => 
    group.matchingOpportunities.length > max.matchingOpportunities.length ? group : max
  )

  return (
    <div className="space-y-6">
      {/* Header thống kê tổng quan */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl p-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            Tổng Quan Gợi Ý Ghép Nối V2.0
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{totalContainers}</div>
              <div className="text-sm text-gray-600">Container có cơ hội</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{totalOpportunities}</div>
              <div className="text-sm text-gray-600">Tổng cơ hội ghép nối</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{highestScore.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Điểm cao nhất</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{averageScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Điểm trung bình</div>
            </div>
          </div>
          
          {/* Phân loại cơ hội */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold text-green-600">{excellentOpportunities}</div>
                <div className="text-xs text-gray-600">Xuất sắc (85+)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-600">{goodOpportunities}</div>
                <div className="text-xs text-gray-600">Tốt (70-84)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <Target className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-semibold text-yellow-600">{fairOpportunities}</div>
                <div className="text-xs text-gray-600">Khá (50-69)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-600">{poorOpportunities}</div>
                <div className="text-xs text-gray-600">Phức tạp (&lt;50)</div>
              </div>
            </div>
          </div>
          
          {/* Thông tin container nổi bật */}
          {mostOpportunitiesContainer && (
            <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">🏆 Container có nhiều cơ hội nhất:</span>
                <Badge variant="secondary">{mostOpportunitiesContainer.dropOffOrder.container_number}</Badge>
                <span className="text-gray-600">
                  ({mostOpportunitiesContainer.matchingOpportunities.length} cơ hội)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danh sách các nhóm gợi ý */}
      <div className="space-y-6">
        {suggestionGroups.map((group) => (
          <DropOffOrderGroup 
            key={group.dropOffOrder.id} 
            group={group} 
            onUpdate={onUpdate}
          />
        ))}
      </div>
      
      {/* Footer với lời khuyên */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">💡 Lời khuyên tối ưu hóa</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Ưu tiên các cơ hội có điểm từ 85+ để đạt hiệu quả tối đa</li>
                <li>• Xem xét chi phí phát sinh trước khi tạo yêu cầu cho các cơ hội điểm thấp</li>
                <li>• Các kịch bản &quot;Street-turn Nội bộ&quot; thường có chi phí thấp nhất</li>
                <li>• Kiểm tra thời gian available vs needed để đảm bảo khả thi</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 