'use client'

import { useState, useEffect } from 'react'
import { SuggestionsContainer } from '@/components/features/dispatcher/suggestions'
import { generateMatchSuggestions } from '@/lib/actions/matching'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, RefreshCw } from 'lucide-react'
import type { MatchSuggestion } from '@/components/dispatcher/types'

export default function DebugSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock organization ID for testing
  const mockOrgId = 'test-org-123'

  const loadSuggestions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await generateMatchSuggestions(mockOrgId, {
        maxDistanceKm: 100,
        maxTimeHours: 168, // 7 days
        minScore: 30
      })
      
      if (result.success && result.data) {
        setSuggestions(result.data)
      } else {
        setError(result.error || 'Có lỗi xảy ra khi tải gợi ý')
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMockData = () => {
    // Create mock data for testing UI
    const mockSuggestions: MatchSuggestion[] = [
      {
        import_container: {
          id: 'container-1',
          container_number: 'TCLU1234567',
          container_type: '20GP',
          container_type_id: 'type-20gp',
          drop_off_location: 'Cảng Cát Lái, TP.HCM',
          available_from_datetime: '2024-01-15T08:00:00Z',
          trucking_company_org_id: 'org-1',
          shipping_line_org_id: 'shipping-1',
          status: 'AVAILABLE',
          is_listed_on_marketplace: true,
          latitude: 10.7769,
          longitude: 106.7009,
          condition_images: null,
          attached_documents: null,
          city_id: 'hcm',
          depot_id: 'depot-1',
          cargo_type_id: 'cargo-1',
          created_at: '2024-01-10T00:00:00Z',
          shipping_line: {
            id: 'shipping-1',
            name: 'Maersk Line'
          }
        },
        export_bookings: [
          {
            id: 'booking-1',
            booking_number: 'BK001234',
            required_container_type: '20GP',
            container_type_id: 'type-20gp',
            pick_up_location: 'Khu Công Nghiệp Tân Thuận, TP.HCM',
            needed_by_datetime: '2024-01-16T14:00:00Z',
            trucking_company_org_id: 'org-1',
            shipping_line_org_id: 'shipping-1',
            status: 'AVAILABLE',
            attached_documents: null,
            city_id: 'hcm',
            depot_id: 'depot-1',
            cargo_type_id: 'cargo-1',
            created_at: '2024-01-12T00:00:00Z',
            matching_score: {
              total_score: 84,
              distance_score: 35,
              time_score: 18,
              complexity_score: 15,
              quality_score: 16,
              partner_score: 8
            },
            scenario_type: 'Street-turn Nội bộ Trên Đường',
            estimated_cost_saving: 450000,
            estimated_co2_saving_kg: 12.5,
            required_actions: [],
            additional_fees: []
          },
          {
            id: 'booking-2',
            booking_number: 'BK001235',
            required_container_type: '20GP',
            container_type_id: 'type-20gp',
            pick_up_location: 'Cảng Hiệp Phước, TP.HCM',
            needed_by_datetime: '2024-01-18T10:00:00Z',
            trucking_company_org_id: 'org-2',
            shipping_line_org_id: 'shipping-1',
            status: 'AVAILABLE',
            attached_documents: null,
            city_id: 'hcm',
            depot_id: 'depot-2',
            cargo_type_id: 'cargo-1',
            created_at: '2024-01-13T00:00:00Z',
            matching_score: {
              total_score: 72,
              distance_score: 28,
              time_score: 15,
              complexity_score: 8,
              quality_score: 21,
              partner_score: 8
            },
            scenario_type: 'Street-turn + COD (Thời gian)',
            estimated_cost_saving: 320000,
            estimated_co2_saving_kg: 18.2,
            required_actions: ['Tạo yêu cầu COD đến depot tạm trữ'],
            additional_fees: [
              { type: 'Phí COD (Thay đổi điểm giao)', amount: 300000 }
            ]
          }
        ],
        total_estimated_cost_saving: 770000,
        total_estimated_co2_saving_kg: 30.7
      },
      {
        import_container: {
          id: 'container-2',
          container_number: 'MSKU9876543',
          container_type: '40HC',
          container_type_id: 'type-40hc',
          drop_off_location: 'ICD Tân Cảng - Long Bình',
          available_from_datetime: '2024-01-16T12:00:00Z',
          trucking_company_org_id: 'org-1',
          shipping_line_org_id: 'shipping-2',
          status: 'AVAILABLE',
          is_listed_on_marketplace: true,
          latitude: 10.8231,
          longitude: 106.8025,
          condition_images: null,
          attached_documents: null,
          city_id: 'hcm',
          depot_id: 'depot-3',
          cargo_type_id: 'cargo-2',
          created_at: '2024-01-11T00:00:00Z',
          shipping_line: {
            id: 'shipping-2',
            name: 'MSC Mediterranean'
          }
        },
        export_bookings: [
          {
            id: 'booking-3',
            booking_number: 'BK001236',
            required_container_type: '40GP',
            container_type_id: 'type-40gp',
            pick_up_location: 'Khu Chế Xuất Tân Thuận, TP.HCM',
            needed_by_datetime: '2024-01-17T16:00:00Z',
            trucking_company_org_id: 'org-1',
            shipping_line_org_id: 'shipping-2',
            status: 'AVAILABLE',
            attached_documents: null,
            city_id: 'hcm',
            depot_id: 'depot-3',
            cargo_type_id: 'cargo-2',
            created_at: '2024-01-14T00:00:00Z',
            matching_score: {
              total_score: 58,
              distance_score: 22,
              time_score: 12,
              complexity_score: 10,
              quality_score: 14,
              partner_score: 6
            },
            scenario_type: 'Street-turn + VAS (Chất lượng)',
            estimated_cost_saving: 280000,
            estimated_co2_saving_kg: 15.8,
            required_actions: ['Kiểm tra và xử lý chất lượng container'],
            additional_fees: [
              { type: 'Dịch vụ VAS (Sửa chữa/Vệ sinh)', amount: 500000 }
            ]
          }
        ],
        total_estimated_cost_saving: 280000,
        total_estimated_co2_saving_kg: 15.8
      }
    ]
    
    setSuggestions(mockSuggestions)
  }

  useEffect(() => {
    loadMockData() // Load mock data by default
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Debug: Matching Suggestions v2.0</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadMockData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Load Mock Data
              </Button>
              <Button
                onClick={loadSuggestions}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Load Real Data
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Mục đích:</strong> Test giao diện mới cho tính năng Matching Suggestions theo Algorithm v2.0</p>
            <p><strong>Tính năng:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Hiển thị gợi ý ghép nối theo cấu trúc 1-to-many (1 container giao trả → nhiều lệnh lấy rỗng)</li>
              <li>Scoring system v2.0 với 4 thành phần: Distance, Time, Complexity, Quality & Partner</li>
              <li>Phân loại kịch bản tự động (Street-turn, COD, VAS, etc.)</li>
              <li>Tính toán chi phí phát sinh và hành động cần thiết</li>
              <li>Giao diện accordion có thể mở rộng để xem chi tiết</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Lỗi: {error}</p>
          </CardContent>
        </Card>
      )}

      <SuggestionsContainer 
        suggestions={suggestions}
        onRequestCreated={() => {
          console.log('Request created successfully!')
          // Reload suggestions after creating request
          loadMockData()
        }}
      />
    </div>
  )
}