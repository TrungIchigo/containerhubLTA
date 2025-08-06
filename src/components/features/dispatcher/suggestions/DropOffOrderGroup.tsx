'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Container, MapPin, Clock } from 'lucide-react'
import { OpportunityRow } from './OpportunityRow'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { MatchSuggestion } from '@/components/dispatcher/types'

interface DropOffOrderGroupProps {
  suggestion: MatchSuggestion
  onCreateRequest: (dropOffOrderId: string, pickupOrderId: string) => void
}

export function DropOffOrderGroup({ suggestion, onCreateRequest }: DropOffOrderGroupProps) {
  const { import_container: dropOffOrder, export_bookings: opportunities } = suggestion
  
  // Tính toán thống kê
  const totalOpportunities = opportunities.length
  const highScoreCount = opportunities.filter(opp => opp.matching_score.total_score >= 75).length
  const mediumScoreCount = opportunities.filter(opp => 
    opp.matching_score.total_score >= 50 && opp.matching_score.total_score < 75
  ).length
  const bestScore = Math.max(...opportunities.map(opp => opp.matching_score.total_score))
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Container className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <CardTitle className="text-lg mb-2">
                Container: {dropOffOrder.container_number}
              </CardTitle>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="font-mono">
                  {dropOffOrder.container_type}
                </Badge>
                {dropOffOrder.shipping_line && (
                  <Badge variant="secondary">
                    {dropOffOrder.shipping_line.name}
                  </Badge>
                )}
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{dropOffOrder.drop_off_location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatStoredDateTimeVN(dropOffOrder.available_from_datetime)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Math.round(bestScore)}
            </div>
            <div className="text-sm text-gray-500 mb-2">Điểm cao nhất</div>
            <div className="text-xs text-gray-500">
              {totalOpportunities} cơ hội
              {highScoreCount > 0 && ` • ${highScoreCount} tốt`}
              {mediumScoreCount > 0 && ` • ${mediumScoreCount} khá`}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {opportunities.map((opportunity) => (
            <OpportunityRow
              key={opportunity.id}
              pickupOrder={opportunity}
              dropOffOrder={dropOffOrder}
              onCreateRequest={onCreateRequest}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}