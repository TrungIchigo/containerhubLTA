'use server'

import { createClient } from '@/lib/supabase/server'
import type { MatchSuggestion, MatchingScore, ExportBookingWithScore } from '@/components/dispatcher/types'
import type { ImportContainer, ExportBooking } from '@/lib/types'

interface MatchingFilters {
  maxDistanceKm?: number
  maxTimeHours?: number
  minScore?: number
  containerType?: string
  shippingLineId?: string
}

/**
 * Tính toán điểm số matching theo Algorithm v2.0
 * @param dropOffContainer Container giao trả
 * @param pickupBooking Lệnh lấy rỗng
 * @param distanceKm Khoảng cách (km)
 * @param timeGapHours Khoảng cách thời gian (giờ)
 */
function calculateMatchScore(
  dropOffContainer: ImportContainer,
  pickupBooking: ExportBooking,
  distanceKm: number,
  timeGapHours: number
): MatchingScore {
  // 1. Operational Optimization Score (60 điểm)
  
  // Distance Score (40 điểm)
  const distanceScore = Math.max(0, Math.min(40, 40 * (1 - distanceKm / 100)))
  
  // Time Score (20 điểm)
  const timeScore = Math.max(0, Math.min(20, 20 * (1 - timeGapHours / 72)))
  
  // 2. Partner & Scenario Score (40 điểm)
  
  // Complexity Score (15 điểm)
  let complexityScore = 0
  const isSameCompany = dropOffContainer.trucking_company_org_id === pickupBooking.trucking_company_org_id
  const isSameCarrier = dropOffContainer.shipping_line_org_id === pickupBooking.shipping_line_org_id
  
  if (isSameCompany && isSameCarrier) {
    complexityScore = 15 // Ideal internal match
  } else if (isSameCompany) {
    complexityScore = 10 // Same company, different carrier
  } else if (isSameCarrier) {
    complexityScore = 8 // Same carrier, different company
  } else {
    complexityScore = 5 // Marketplace transaction
  }
  
  // Quality & Partner Score (25 điểm)
  // Container quality match (15 điểm)
  const qualityMatch = dropOffContainer.container_type === pickupBooking.required_container_type
  const qualityScore = qualityMatch ? 15 : 5 // Penalty for mismatch requiring VAS
  
  // Partner reputation (10 điểm) - Default to 8 for now
  const partnerScore = 8
  
  const totalScore = distanceScore + timeScore + complexityScore + qualityScore + partnerScore
  
  return {
    total_score: Math.min(100, totalScore),
    distance_score: distanceScore,
    time_score: timeScore,
    complexity_score: complexityScore,
    quality_score: qualityScore + partnerScore,
    partner_score: partnerScore
  }
}

/**
 * Xác định loại kịch bản dựa trên điểm số và đặc điểm
 */
function determineScenarioType(
  score: MatchingScore,
  dropOffContainer: ImportContainer,
  pickupBooking: ExportBooking,
  distanceKm: number,
  timeGapHours: number
): string {
  const isSameCompany = dropOffContainer.trucking_company_org_id === pickupBooking.trucking_company_org_id
  const isSameCarrier = dropOffContainer.shipping_line_org_id === pickupBooking.shipping_line_org_id
  const qualityMatch = dropOffContainer.container_type === pickupBooking.required_container_type
  
  if (score.total_score >= 85) {
    if (isSameCompany && isSameCarrier) {
      return distanceKm < 5 ? 'Street-turn Nội bộ Trên Đường' : 'Depot Turn Nội bộ'
    }
    return 'Street-turn Marketplace Tối ưu'
  }
  
  if (score.total_score >= 70) {
    if (!qualityMatch) {
      return 'Street-turn + VAS (Chất lượng)'
    }
    if (timeGapHours > 24) {
      return 'Street-turn + Thay đổi địa điểm (Thời gian)'
    }
    return 'Street-turn Marketplace Hiệu quả'
  }
  
  if (score.total_score >= 50) {
    return 'Street-turn Phức tạp (Cần tối ưu)'
  }
  
  return 'Street-turn Khó khăn (Cân nhắc)'
}

/**
 * Tính toán chi phí và hành động bổ sung
 */
function calculateAdditionalCosts(
  dropOffContainer: ImportContainer,
  pickupBooking: ExportBooking,
  distanceKm: number,
  timeGapHours: number
): {
  additional_fees: Array<{ type: string; amount: number }>
  required_actions: string[]
  estimated_cost_saving: number
  estimated_co2_saving_kg: number
} {
  const additional_fees: Array<{ type: string; amount: number }> = []
  const required_actions: string[] = []
  
  // VAS costs for quality mismatch
  const qualityMatch = dropOffContainer.container_type === pickupBooking.required_container_type
  if (!qualityMatch) {
    additional_fees.push({ type: 'Dịch vụ VAS (Sửa chữa/Vệ sinh)', amount: 500000 })
    required_actions.push('Kiểm tra và xử lý chất lượng container')
  }
  
  // Phí thay đổi địa điểm cho time mismatch
      if (timeGapHours > 24) {
        additional_fees.push({ type: 'Phí thay đổi địa điểm giao', amount: 300000 })
        required_actions.push('Tạo yêu cầu thay đổi địa điểm đến depot tạm trữ')
  }
  
  // Storage costs for long delays
  if (timeGapHours > 72) {
    const storageDays = Math.ceil((timeGapHours - 72) / 24)
    additional_fees.push({ type: `Phí lưu kho (${storageDays} ngày)`, amount: storageDays * 100000 })
    required_actions.push('Sắp xếp lưu trữ tại depot GPG')
  }
  
  // Calculate savings (baseline: normal trucking cost)
  const baselineCost = distanceKm * 15000 // 15k VND per km
  const totalAdditionalCosts = additional_fees.reduce((sum, fee) => sum + fee.amount, 0)
  const estimated_cost_saving = Math.max(0, baselineCost - totalAdditionalCosts)
  
  // CO2 savings (approximate)
  const estimated_co2_saving_kg = distanceKm * 0.8 // 0.8kg CO2 per km saved
  
  return {
    additional_fees,
    required_actions,
    estimated_cost_saving,
    estimated_co2_saving_kg
  }
}

/**
 * Tạo gợi ý matching cho dispatcher
 */
export async function generateMatchSuggestions(
  organizationId: string,
  filters: MatchingFilters = {}
): Promise<{ success: boolean; data?: MatchSuggestion[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Lấy danh sách container giao trả
    const { data: importContainers, error: importError } = await supabase
      .from('import_containers')
      .select(`
        *,
        shipping_line:organizations!shipping_line_org_id(id, name)
      `)
      .eq('trucking_company_org_id', organizationId)
      .eq('status', 'AVAILABLE')
      .eq('is_listed_on_marketplace', true)
    
    if (importError) throw importError
    
    // Lấy danh sách lệnh lấy rỗng
    const { data: exportBookings, error: exportError } = await supabase
      .from('export_bookings')
      .select('*')
      .eq('trucking_company_org_id', organizationId)
      .eq('status', 'AVAILABLE')
    
    if (exportError) throw exportError
    
    if (!importContainers?.length || !exportBookings?.length) {
      return { success: true, data: [] }
    }
    
    const suggestions: MatchSuggestion[] = []
    
    // Xử lý từng container giao trả
    for (const container of importContainers) {
      const opportunities: ExportBookingWithScore[] = []
      
      // Tìm các lệnh lấy rỗng phù hợp
      for (const booking of exportBookings) {
        // Hard filters
        if (filters.containerType && booking.required_container_type !== filters.containerType) {
          continue
        }
        
        if (filters.shippingLineId && booking.shipping_line_org_id !== filters.shippingLineId) {
          continue
        }
        
        // Calculate distance (simplified - using coordinates if available)
        const distanceKm = Math.random() * 50 + 5 // Mock distance for now
        
        if (filters.maxDistanceKm && distanceKm > filters.maxDistanceKm) {
          continue
        }
        
        // Calculate time gap
        const containerTime = new Date(container.available_from_datetime)
        const bookingTime = new Date(booking.needed_by_datetime)
        const timeGapHours = Math.abs(bookingTime.getTime() - containerTime.getTime()) / (1000 * 60 * 60)
        
        if (filters.maxTimeHours && timeGapHours > filters.maxTimeHours) {
          continue
        }
        
        // Calculate matching score
        const matchingScore = calculateMatchScore(container, booking, distanceKm, timeGapHours)
        
        if (filters.minScore && matchingScore.total_score < filters.minScore) {
          continue
        }
        
        // Determine scenario and costs
        const scenarioType = determineScenarioType(matchingScore, container, booking, distanceKm, timeGapHours)
        const costs = calculateAdditionalCosts(container, booking, distanceKm, timeGapHours)
        
        opportunities.push({
          ...booking,
          matching_score: matchingScore,
          scenario_type: scenarioType,
          ...costs
        })
      }
      
      // Sắp xếp theo điểm số giảm dần
      opportunities.sort((a, b) => b.matching_score.total_score - a.matching_score.total_score)
      
      if (opportunities.length > 0) {
        suggestions.push({
          import_container: container,
          export_bookings: opportunities,
          total_estimated_cost_saving: opportunities.reduce((sum, opp) => sum + opp.estimated_cost_saving, 0),
          total_estimated_co2_saving_kg: opportunities.reduce((sum, opp) => sum + opp.estimated_co2_saving_kg, 0)
        })
      }
    }
    
    // Sắp xếp suggestions theo tổng tiết kiệm chi phí
    suggestions.sort((a, b) => b.total_estimated_cost_saving - a.total_estimated_cost_saving)
    
    return { success: true, data: suggestions }
    
  } catch (error: any) {
    console.error('Error generating match suggestions:', error)
    return { success: false, error: error.message }
  }
}