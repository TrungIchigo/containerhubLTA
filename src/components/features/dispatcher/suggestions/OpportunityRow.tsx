'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScoreBadge } from './ScoreBadge'
import type { ExportBookingWithScore } from '@/components/dispatcher/types'
import type { ImportContainer } from '@/lib/types'

interface OpportunityRowProps {
  pickupOrder: ExportBookingWithScore
  dropOffOrder: ImportContainer & {
    shipping_line?: {
      id: string
      name: string
    }
  }
  onCreateRequest: (dropOffOrderId: string, pickupOrderId: string) => void
}

export function OpportunityRow({ pickupOrder, dropOffOrder, onCreateRequest }: OpportunityRowProps) {
  const [isCreatingRequest, setIsCreatingRequest] = useState(false)
  
  // Kiểm tra và xử lý dữ liệu an toàn
  const overallScore = pickupOrder?.matching_score?.total_score ?? 0
  const scoreDetails = pickupOrder?.matching_score ?? {
    distance_score: 0,
    time_score: 0,
    complexity_score: 0,
    quality_score: 0,
    total_score: 0
  }
  const scenarioType = pickupOrder?.scenario_type || 'Street-turn Nội bộ Trên Đường'
  const extraTasks = pickupOrder?.required_actions || []
  const estimatedCosts = pickupOrder?.additional_fees || []

  const handleCreateRequest = async () => {
    setIsCreatingRequest(true)
    try {
      await onCreateRequest(dropOffOrder.id, pickupOrder.id)
    } finally {
      setIsCreatingRequest(false)
    }
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1" className="border-b-0">
        {/* Phần luôn hiển thị */}
        <div className="flex items-center p-4">
          <ScoreBadge score={overallScore} />
          <div className="ml-4 flex-grow">
            <p className="font-semibold">Ghép với Lệnh: {pickupOrder.booking_number}</p>
            <p className="text-sm text-gray-600">📍 Lấy tại: {pickupOrder.pick_up_location}</p>
          </div>
          <AccordionTrigger className="px-2" />
        </div>

        {/* Phần chi tiết có thể mở rộng */}
        <AccordionContent className="px-4 pb-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Phân Tích Điểm Số</h4>
              <p>Khoảng cách: {(scoreDetails.distance_score ?? 0).toFixed(1)}/40</p>
              <p>Thời gian: {(scoreDetails.time_score ?? 0).toFixed(1)}/20</p>
              <p>Độ phức tạp: {scoreDetails.complexity_score ?? 0}/15</p>
              <p>Chất lượng & Uy tín: {(scoreDetails.quality_score ?? 0).toFixed(1)}/25</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Chi Tiết Kịch Bản</h4>
              <p><b>Loại:</b> {scenarioType}</p>
              {extraTasks.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Tác vụ thêm:</p>
                  <ul className="list-disc list-inside">
                    {extraTasks.map((task, index) => <li key={index}>{task}</li>)}
                  </ul>
                </div>
              )}
              {estimatedCosts.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Chi phí phát sinh:</p>
                  <ul className="list-disc list-inside">
                    {estimatedCosts.map((cost, index) => (
                      <li key={index}>{cost?.type || 'Không xác định'}: {(cost?.amount ?? 0).toLocaleString()}đ</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 text-right">
            <Button 
              onClick={handleCreateRequest}
              disabled={isCreatingRequest}
            >
              {isCreatingRequest ? 'Đang tạo...' : 'Tạo Yêu Cầu'}
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}