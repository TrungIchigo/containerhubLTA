'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Loader2, DollarSign, Leaf, MapPin, ArrowRight, Calculator, Clock, ChevronDown, ChevronUp, Container, Ship, Truck, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { createStreetTurnRequest } from '@/lib/actions/dispatcher'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { StreetTurnSuggestionGroup, MatchingOpportunity } from '@/lib/types'

interface AdvancedMatchSuggestionsProps {
  suggestions: StreetTurnSuggestionGroup[]
  onUpdate?: () => void
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-blue-600'
  if (score >= 50) return 'text-yellow-600'
  if (score >= 30) return 'text-orange-600'
  return 'text-red-600'
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 85) return 'default'
  if (score >= 70) return 'secondary'
  if (score >= 50) return 'outline'
  return 'destructive'
}

function getScoreIcon(score: number) {
  if (score >= 85) return <CheckCircle className="h-4 w-4" />
  if (score >= 70) return <Info className="h-4 w-4" />
  if (score >= 30) return <AlertTriangle className="h-4 w-4" />
  return <AlertTriangle className="h-4 w-4" />
}

function OpportunityCard({ 
  opportunity, 
  dropOffContainer, 
  onCreateRequest 
}: { 
  opportunity: MatchingOpportunity
  dropOffContainer: any
  onCreateRequest: (containerId: string, bookingId: string) => void 
}) {
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateRequest = async () => {
    setIsCreating(true)
    try {
      await onCreateRequest(dropOffContainer.id, opportunity.pickupOrder.id)
    } finally {
      setIsCreating(false)
    }
  }

  const totalEstimatedCost = opportunity.estimatedCosts.reduce((sum, cost) => sum + cost.amount, 0)

  return (
    <Card className="mb-4 border-l-4 border-l-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getScoreIcon(opportunity.overallScore)}
              <span className={`text-2xl font-bold ${getScoreColor(opportunity.overallScore)}`}>
                {opportunity.overallScore}
              </span>
              <span className="text-sm text-gray-600">/100</span>
            </div>
            <Badge variant={getScoreBadgeVariant(opportunity.overallScore)}>
              {opportunity.scenarioType}
            </Badge>
          </div>
          <Button 
            onClick={handleCreateRequest}
            disabled={isCreating}
            size="sm"
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo Yêu Cầu
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Thông tin booking */}
        <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
          <Ship className="h-5 w-5 text-blue-600 mt-1" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {opportunity.pickupOrder.booking_number}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {opportunity.pickupOrder.pick_up_location}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Cần vào: {formatStoredDateTimeVN(opportunity.pickupOrder.needed_by_datetime)}
            </div>
          </div>
        </div>

        {/* Chi tiết điểm số */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Khoảng cách:</span>
              <span className="font-medium">{opportunity.scoreDetails.distance}/40</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Thời gian:</span>
              <span className="font-medium">{opportunity.scoreDetails.time}/20</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Phức tạp:</span>
              <span className="font-medium">{opportunity.scoreDetails.complexity}/15</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Chất lượng:</span>
              <span className="font-medium">{opportunity.scoreDetails.quality}/25</span>
            </div>
          </div>
        </div>

        {/* Tác vụ bổ sung */}
        {opportunity.extraTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Tác vụ cần thực hiện:</h4>
            <div className="space-y-1">
              {opportunity.extraTasks.map((task, index) => (
                <div key={index} className="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded">
                  {task}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chi phí ước tính */}
        {opportunity.estimatedCosts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Chi phí phát sinh:</h4>
            <div className="space-y-1">
              {opportunity.estimatedCosts.map((cost, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cost.type}:</span>
                  <span className="font-medium text-red-600">
                    {cost.amount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              ))}
              {opportunity.estimatedCosts.length > 1 && (
                <div className="flex justify-between text-sm border-t pt-1">
                  <span className="font-medium">Tổng cộng:</span>
                  <span className="font-bold text-red-600">
                    {totalEstimatedCost.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SuggestionGroup({ 
  suggestionGroup, 
  onCreateRequest 
}: { 
  suggestionGroup: StreetTurnSuggestionGroup
  onCreateRequest: (containerId: string, bookingId: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const bestScore = suggestionGroup.matchingOpportunities[0]?.overallScore || 0
  const opportunityCount = suggestionGroup.matchingOpportunities.length

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Container className="h-6 w-6 text-green-600" />
                <div>
                  <CardTitle className="text-lg">
                    {suggestionGroup.dropOffOrder.container_number}
                  </CardTitle>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {suggestionGroup.dropOffOrder.drop_off_location}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sẵn sàng: {formatStoredDateTimeVN(suggestionGroup.dropOffOrder.available_from_datetime)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {opportunityCount} cơ hội
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Tốt nhất:</span>
                    <span className={`text-lg font-bold ${getScoreColor(bestScore)}`}>
                      {bestScore}
                    </span>
                    {getScoreIcon(bestScore)}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {suggestionGroup.matchingOpportunities.map((opportunity, index) => (
                <OpportunityCard
                  key={`${suggestionGroup.dropOffOrder.id}-${opportunity.pickupOrder.id}`}
                  opportunity={opportunity}
                  dropOffContainer={suggestionGroup.dropOffOrder}
                  onCreateRequest={onCreateRequest}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function AdvancedMatchSuggestions({ 
  suggestions, 
  onUpdate 
}: AdvancedMatchSuggestionsProps) {
  const [isCreatingRequest, setIsCreatingRequest] = useState(false)

  const handleCreateRequest = async (containerId: string, bookingId: string) => {
    setIsCreatingRequest(true)
    try {
      await createStreetTurnRequest(containerId, bookingId)
      onUpdate?.()
    } catch (error: any) {
      console.error('Error creating street-turn request:', error)
      alert(error.message || 'Có lỗi xảy ra khi tạo yêu cầu')
    } finally {
      setIsCreatingRequest(false)
    }
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calculator className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không có gợi ý ghép nối
          </h3>
          <p className="text-gray-600 text-center">
            Hiện tại không có cặp container và booking nào phù hợp để thực hiện street-turn.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalOpportunities = suggestions.reduce((sum, group) => sum + group.matchingOpportunities.length, 0)

  return (
    <div className="space-y-6">
      {/* Header thống kê */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Gợi Ý Ghép Nối V2.0
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{suggestions.length}</div>
              <div className="text-sm text-gray-600">Container có cơ hội</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalOpportunities}</div>
              <div className="text-sm text-gray-600">Tổng cơ hội ghép nối</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {suggestions.filter(g => g.matchingOpportunities[0]?.overallScore >= 85).length}
              </div>
              <div className="text-sm text-gray-600">Cơ hội xuất sắc (≥85)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách suggestions */}
      <div className="space-y-4">
        {suggestions.map((suggestionGroup) => (
          <SuggestionGroup
            key={suggestionGroup.dropOffOrder.id}
            suggestionGroup={suggestionGroup}
            onCreateRequest={handleCreateRequest}
          />
        ))}
      </div>
    </div>
  )
} 