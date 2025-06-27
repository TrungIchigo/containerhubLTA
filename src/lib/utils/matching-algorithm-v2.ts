import type { 
  ImportContainer, 
  ExportBooking, 
  MatchingOpportunity, 
  StreetTurnSuggestionGroup,
  ScenarioAnalysis 
} from '@/lib/types'
import { calculateDistance } from '@/lib/google-maps'

// Các hằng số cho thuật toán V2.0
const CONSTANTS = {
  // Ngưỡng tham chiếu
  DISTANCE_REFERENCE_KM: 100,
  TIME_REFERENCE_HOURS: 72,
  
  // Điểm tối đa cho từng thành phần
  MAX_DISTANCE_SCORE: 40,
  MAX_TIME_SCORE: 20,
  MAX_COMPLEXITY_SCORE: 15,
  MAX_QUALITY_SCORE: 25,
  
  // Ngưỡng điểm tối thiểu để hiển thị
  MIN_SCORE_THRESHOLD: 20
}

/**
 * Phân tích kịch bản ghép nối
 */
export function analyzeScenario(
  dropOffOrder: ImportContainer,
  pickupOrder: ExportBooking
): ScenarioAnalysis {
  const isInternal = dropOffOrder.trucking_company_org_id === pickupOrder.trucking_company_org_id
  const isSameShippingLine = dropOffOrder.shipping_line_org_id === pickupOrder.shipping_line_org_id
  const isSameDepot = dropOffOrder.depot_id === pickupOrder.depot_id
  
  // Xác định nhu cầu COD (Change of Destination)
  const needsCOD = !isSameDepot && isInternal
  
  // Xác định nhu cầu VAS (Value Added Services) - tạm thời set false, có thể mở rộng sau
  const needsVAS = false
  
  // Xác định mức độ phức tạp và loại kịch bản
  let complexityLevel: number
  let scenarioType: string
  
  if (isInternal && isSameShippingLine && isSameDepot) {
    complexityLevel = 15 // Street-turn "Tại Depot" (Cùng NVT)
    scenarioType = "Street-turn Nội bộ Tại Depot"
  } else if (isInternal && isSameShippingLine && !isSameDepot) {
    complexityLevel = 12 // Street-turn "Trên đường" (Cùng NVT)
    scenarioType = "Street-turn Nội bộ Trên Đường"
  } else if (!isInternal && isSameShippingLine) {
    complexityLevel = 8 // Marketplace (Khác NVT, Cùng HT)
    scenarioType = "Marketplace"
  } else if (isInternal && needsCOD) {
    complexityLevel = 5 // Kết hợp COD + Street-turn
    scenarioType = "Kết hợp COD + Street-turn"
  } else if (needsVAS) {
    complexityLevel = 5 // Sử dụng Bãi ảo/VAS
    scenarioType = "Sử dụng Dịch vụ VAS"
  } else if (isInternal && !isSameShippingLine) {
    complexityLevel = 2 // Cùng NVT, Khác HT (Cần đổi booking)
    scenarioType = "Cùng NVT - Khác Hãng Tàu"
  } else {
    complexityLevel = 2 // Các trường hợp khác
    scenarioType = "Phức tạp"
  }
  
  return {
    isInternal,
    isSameShippingLine,
    isSameDepot,
    needsCOD,
    needsVAS,
    complexityLevel,
    scenarioType
  }
}

/**
 * Tính điểm khoảng cách (0-40 điểm)
 */
export function calculateDistanceScore(
  dropOffOrder: ImportContainer,
  pickupOrder: ExportBooking
): number {
  // Nếu không có tọa độ, trả về điểm trung bình
  if (!dropOffOrder.latitude || !dropOffOrder.longitude || 
      !pickupOrder.latitude || !pickupOrder.longitude) {
    return 20 // Điểm trung bình khi không có dữ liệu
  }
  
  const distance = calculateDistance(
    dropOffOrder.latitude, dropOffOrder.longitude,
    pickupOrder.latitude, pickupOrder.longitude
  )
  
  // Chuẩn hóa và giới hạn
  const distanceNorm = distance / CONSTANTS.DISTANCE_REFERENCE_KM
  const clippedDistanceNorm = Math.min(distanceNorm, 1.0)
  
  return CONSTANTS.MAX_DISTANCE_SCORE * (1 - clippedDistanceNorm)
}

/**
 * Tính điểm thời gian (0-20 điểm)
 */
export function calculateTimeScore(
  dropOffOrder: ImportContainer,
  pickupOrder: ExportBooking
): number {
  const containerAvailable = new Date(dropOffOrder.available_from_datetime)
  const bookingNeeded = new Date(pickupOrder.needed_by_datetime)
  
  // Container phải có sẵn trước khi booking cần
  if (containerAvailable > bookingNeeded) {
    return 0
  }
  
  // Tính thời gian chờ tính bằng giờ
  const timeDifferenceMs = bookingNeeded.getTime() - containerAvailable.getTime()
  const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60)
  
  // Chuẩn hóa và giới hạn
  const timeNorm = timeDifferenceHours / CONSTANTS.TIME_REFERENCE_HOURS
  const clippedTimeNorm = Math.min(timeNorm, 1.0)
  
  return CONSTANTS.MAX_TIME_SCORE * (1 - clippedTimeNorm)
}

/**
 * Tính điểm chất lượng & uy tín (0-25 điểm)
 */
export function calculateQualityScore(
  scenario: ScenarioAnalysis,
  partnerRating?: number
): number {
  // Điểm khớp chất lượng (0-15 điểm)
  // Tạm thời giả định chất lượng luôn khớp, có thể mở rộng sau
  const qualityMatchScore = 15
  
  // Điểm uy tín đối tác (0-10 điểm) - chỉ áp dụng cho Marketplace
  let partnerReputationScore = 0
  if (!scenario.isInternal && partnerRating) {
    partnerReputationScore = (partnerRating / 5) * 10
  } else if (scenario.isInternal) {
    // Nội bộ thì luôn có điểm uy tín tối đa
    partnerReputationScore = 10
  }
  
  return qualityMatchScore + partnerReputationScore
}

/**
 * Tạo danh sách tác vụ bổ sung và chi phí ước tính
 */
export function generateExtraTasksAndCosts(scenario: ScenarioAnalysis) {
  const extraTasks: string[] = []
  const estimatedCosts: Array<{ type: string; amount: number }> = []
  
  if (scenario.needsCOD) {
    extraTasks.push("[Yêu cầu COD] Đổi nơi trả về Depot khác")
    estimatedCosts.push({ type: "COD_FEE", amount: 350000 })
  }
  
  if (scenario.needsVAS) {
    extraTasks.push("[Dịch vụ VAS] Vệ sinh/Sửa chữa container")
    estimatedCosts.push({ type: "VAS_FEE", amount: 200000 })
  }
  
  if (!scenario.isSameShippingLine && scenario.isInternal) {
    extraTasks.push("[Thủ tục] Đổi booking sang hãng tàu khác")
  }
  
  if (!scenario.isInternal) {
    extraTasks.push("[Marketplace] Thỏa thuận với đối tác ngoài")
    estimatedCosts.push({ type: "MARKETPLACE_FEE", amount: 150000 })
  }
  
  return { extraTasks, estimatedCosts }
}

/**
 * Hàm chính tính điểm cho một cặp ghép nối
 */
export function calculateMatchScore(
  dropOffOrder: ImportContainer,
  pickupOrder: ExportBooking,
  partnerRating?: number
): MatchingOpportunity {
  // Phân tích kịch bản
  const scenario = analyzeScenario(dropOffOrder, pickupOrder)
  
  // Tính các điểm thành phần
  const distanceScore = calculateDistanceScore(dropOffOrder, pickupOrder)
  const timeScore = calculateTimeScore(dropOffOrder, pickupOrder)
  const complexityScore = scenario.complexityLevel
  const qualityScore = calculateQualityScore(scenario, partnerRating)
  
  // Tính tổng điểm
  const overallScore = distanceScore + timeScore + complexityScore + qualityScore
  
  // Tạo tác vụ bổ sung và chi phí
  const { extraTasks, estimatedCosts } = generateExtraTasksAndCosts(scenario)
  
  return {
    pickupOrder,
    overallScore: Math.round(overallScore * 100) / 100, // Làm tròn 2 chữ số thập phân
    scenarioType: scenario.scenarioType,
    scoreDetails: {
      distance: Math.round(distanceScore * 100) / 100,
      time: Math.round(timeScore * 100) / 100,
      complexity: complexityScore,
      quality: Math.round(qualityScore * 100) / 100
    },
    extraTasks,
    estimatedCosts
  }
}

/**
 * Hàm chính tạo gợi ý ghép nối theo cấu trúc 1-nhiều
 */
export function generateMatchingSuggestions(
  userOrganizationId: string,
  importContainers: ImportContainer[],
  exportBookings: ExportBooking[],
  partnerRatings?: Record<string, number>
): StreetTurnSuggestionGroup[] {
  const results: StreetTurnSuggestionGroup[] = []
  
  // Lọc các container và booking có sẵn
  const availableContainers = importContainers.filter(c => c.status === 'AVAILABLE')
  const availableBookings = exportBookings.filter(b => b.status === 'AVAILABLE')
  
  // Vòng lặp chính - Lặp qua từng Lệnh Giao Trả
  for (const dropOffOrder of availableContainers) {
    const suggestionGroup: StreetTurnSuggestionGroup = {
      dropOffOrder,
      matchingOpportunities: []
    }
    
    // Vòng lặp phụ - Lặp qua từng Lệnh Lấy Rỗng
    for (const pickupOrder of availableBookings) {
      // Bộ lọc cứng
      
      // 1. Kiểm tra loại container
      const containerTypeMatches = dropOffOrder.container_type_id && pickupOrder.container_type_id 
        ? dropOffOrder.container_type_id === pickupOrder.container_type_id
        : dropOffOrder.container_type === pickupOrder.required_container_type
      
      if (!containerTypeMatches) {
        continue
      }
      
      // 2. Kiểm tra thời gian cơ bản (container phải có sẵn trước khi booking cần)
      const containerAvailable = new Date(dropOffOrder.available_from_datetime)
      const bookingNeeded = new Date(pickupOrder.needed_by_datetime)
      
      if (containerAvailable > bookingNeeded) {
        continue
      }
      
      // 3. Kiểm tra khoảng cách thời gian tối thiểu (2 giờ)
      const timeDifferenceMs = bookingNeeded.getTime() - containerAvailable.getTime()
      const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60)
      
      if (timeDifferenceHours < 2) {
        continue
      }
      
      // Tính điểm
      const partnerRating = partnerRatings?.[pickupOrder.trucking_company_org_id]
      const matchResult = calculateMatchScore(dropOffOrder, pickupOrder, partnerRating)
      
      // Chỉ thêm nếu điểm >= ngưỡng tối thiểu
      if (matchResult.overallScore >= CONSTANTS.MIN_SCORE_THRESHOLD) {
        suggestionGroup.matchingOpportunities.push(matchResult)
      }
    }
    
    // Sắp xếp các cơ hội theo điểm từ cao đến thấp
    suggestionGroup.matchingOpportunities.sort((a, b) => b.overallScore - a.overallScore)
    
    // Chỉ thêm nhóm nếu có ít nhất 1 cơ hội
    if (suggestionGroup.matchingOpportunities.length > 0) {
      results.push(suggestionGroup)
    }
  }
  
  return results
} 