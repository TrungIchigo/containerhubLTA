'use client'

import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScoreBadge } from "./ScoreBadge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Ship, Loader2, DollarSign } from 'lucide-react'
import { createStreetTurnRequest } from '@/lib/actions/dispatcher'
import { formatStoredDateTimeVN } from '@/lib/utils'
import type { MatchingOpportunity, ImportContainer } from '@/lib/types'

interface OpportunityRowProps {
  opportunity: MatchingOpportunity
  dropOffOrder: ImportContainer
  onUpdate?: () => void
}

export function OpportunityRow({ opportunity, dropOffOrder, onUpdate }: OpportunityRowProps) {
  const [isCreating, setIsCreating] = useState(false)
  const { pickupOrder, overallScore, scenarioType, scoreDetails, extraTasks, estimatedCosts } = opportunity

  // Hàm tạo yêu cầu Street-turn
  const handleCreateRequest = async () => {
    setIsCreating(true)
    try {
      await createStreetTurnRequest(dropOffOrder.id, pickupOrder.id)
      onUpdate?.()
    } catch (error: any) {
      console.error('Error creating street-turn request:', error)
      alert(error.message || 'Có lỗi xảy ra khi tạo yêu cầu')
    } finally {
      setIsCreating(false)
    }
  }

  const totalEstimatedCost = estimatedCosts.reduce((sum, cost) => sum + cost.amount, 0)

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1" className="border-b-0">
        {/* Phần luôn hiển thị */}
        <div className="flex items-center p-4 hover:bg-gray-50 transition-colors">
          <ScoreBadge score={overallScore} />
          
          <div className="ml-4 flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-lg">Lệnh: {pickupOrder.booking_number}</p>
              <Badge variant="outline">{scenarioType}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Lấy tại: {pickupOrder.pick_up_location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Cần vào: {formatStoredDateTimeVN(pickupOrder.needed_by_datetime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Ship className="h-3 w-3" />
                <span>{pickupOrder.required_container_type}</span>
              </div>
            </div>
            {totalEstimatedCost > 0 && (
              <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                <DollarSign className="h-3 w-3" />
                <span>Chi phí phát sinh: {totalEstimatedCost.toLocaleString('vi-VN')} VND</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCreateRequest}
              disabled={isCreating}
              size="sm"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo Yêu Cầu
            </Button>
            <AccordionTrigger className="px-2" />
          </div>
        </div>

        {/* Phần chi tiết có thể mở rộng */}
        <AccordionContent className="px-4 pb-4 bg-gray-50 border-t p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Cột 1: Phân Tích Điểm Số */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-900">📊 Phân Tích Điểm Số</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Khoảng cách:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(scoreDetails.distance / 40) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{scoreDetails.distance.toFixed(1)}/40</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Thời gian:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(scoreDetails.time / 20) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{scoreDetails.time.toFixed(1)}/20</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Độ phức tạp:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${(scoreDetails.complexity / 15) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{scoreDetails.complexity}/15</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Chất lượng & Uy tín:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(scoreDetails.quality / 25) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{scoreDetails.quality.toFixed(1)}/25</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Tổng điểm:</span>
                    <span className="text-lg">{overallScore.toFixed(1)}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 2: Chi Tiết Kịch Bản */}
            <div>
              <h4 className="font-semibold mb-3 text-gray-900">🎯 Chi Tiết Kịch Bản</h4>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Loại kịch bản:</span>
                  <p className="text-gray-700">{scenarioType}</p>
                </div>
                
                {extraTasks.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">⚠️ Tác vụ cần thực hiện:</p>
                    <ul className="space-y-1">
                      {extraTasks.map((task, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span className="text-gray-700">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {estimatedCosts.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">💰 Chi phí phát sinh:</p>
                    <ul className="space-y-1">
                      {estimatedCosts.map((cost, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <span className="text-gray-700">{cost.type}:</span>
                          <span className="font-medium text-red-600">
                            {cost.amount.toLocaleString('vi-VN')} VND
                          </span>
                        </li>
                      ))}
                      {estimatedCosts.length > 1 && (
                        <li className="flex justify-between items-center pt-2 border-t border-gray-300 font-semibold">
                          <span>Tổng cộng:</span>
                          <span className="text-red-600">
                            {totalEstimatedCost.toLocaleString('vi-VN')} VND
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
} 