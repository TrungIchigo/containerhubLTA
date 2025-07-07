import type { ImportContainer, ExportBooking } from '@/lib/types'

interface MatchingScore {
  total_score: number
  distance_score: number
  time_score: number
  complexity_score: number
  quality_score: number
  partner_score?: number
}

export interface ScoredExportBooking extends ExportBooking {
  matching_score: MatchingScore
  estimated_cost_saving: number
  estimated_co2_saving_kg: number
}

export interface MatchSuggestion {
  import_container: ImportContainer
  export_bookings: ScoredExportBooking[]
  total_estimated_cost_saving: number
  total_estimated_co2_saving_kg: number
}

const DISTANCE_REFERENCE_KM = 100 // Khoảng cách tham chiếu 100km
const TIME_REFERENCE_HOURS = 72 // Thời gian tham chiếu 72 giờ

function calculateDistanceScore(distanceKm: number): number {
  const normalizedDistance = distanceKm / DISTANCE_REFERENCE_KM
  const clippedDistance = Math.min(normalizedDistance, 1.0)
  return 40 * (1 - clippedDistance)
}

function calculateTimeScore(waitingHours: number): number {
  const normalizedTime = waitingHours / TIME_REFERENCE_HOURS
  const clippedTime = Math.min(normalizedTime, 1.0)
  return 20 * (1 - clippedTime)
}

function calculateComplexityScore(scenario: {
  isStreetTurnAtDepot: boolean
  isStreetTurnOnRoad: boolean
  isDifferentCarrier: boolean
  isSameShippingLine: boolean
  hasCOD: boolean
  hasVAS: boolean
}): number {
  let score = 0

  if (scenario.isStreetTurnAtDepot && !scenario.isDifferentCarrier) score += 15
  else if (scenario.isStreetTurnOnRoad && !scenario.isDifferentCarrier) score += 12
  else if (scenario.isDifferentCarrier && scenario.isSameShippingLine) score += 8
  
  if (scenario.hasCOD) score += 5
  if (scenario.hasVAS) score += 5
  if (!scenario.isDifferentCarrier && !scenario.isSameShippingLine) score += 2

  return Math.min(score, 15) // Cap at 15 points
}

function calculateQualityScore(container: ImportContainer, booking: ExportBooking, partnerRating?: number): number {
  let score = 0
  
  // Quality match score (max 15)
  // Giả định container luôn đạt chất lượng yêu cầu nếu có condition_images
  if (container.condition_images && container.condition_images.length > 0) {
    score += 15
  } else {
    // Nếu không có hình ảnh, cho điểm mặc định
    score += 10
  }

  // Partner rating score (max 10)
  if (partnerRating !== undefined) {
    score += (partnerRating / 5) * 10
  }

  return score
}

function calculateMatchingScore(
  container: ImportContainer,
  booking: ExportBooking,
  distanceKm: number,
  scenario: {
    isStreetTurnAtDepot: boolean
    isStreetTurnOnRoad: boolean
    isDifferentCarrier: boolean
    isSameShippingLine: boolean
    hasCOD: boolean
    hasVAS: boolean
  }
): MatchingScore {
  // Calculate waiting hours between container available time and booking needed time
  const containerTime = new Date(container.available_from_datetime)
  const bookingTime = new Date(booking.needed_by_datetime)
  const waitingHours = Math.max(0, (bookingTime.getTime() - containerTime.getTime()) / (1000 * 60 * 60))

  const distance_score = calculateDistanceScore(distanceKm)
  const time_score = calculateTimeScore(waitingHours)
  const complexity_score = calculateComplexityScore(scenario)
  const quality_score = calculateQualityScore(
    container,
    booking,
    scenario.isDifferentCarrier ? 4.5 : undefined // Example partner rating
  )

  const total_score = distance_score + time_score + complexity_score + quality_score

  return {
    total_score,
    distance_score,
    time_score,
    complexity_score,
    quality_score,
    partner_score: scenario.isDifferentCarrier ? quality_score - 15 : undefined // Partner score is the remaining after quality match
  }
}

export function generateMatchingSuggestions(
  containers: ImportContainer[],
  bookings: ExportBooking[]
): MatchSuggestion[] {
  const suggestions: MatchSuggestion[] = []

  // Group compatible bookings for each container
  containers.forEach(container => {
    const compatibleBookings: ScoredExportBooking[] = []
    let total_cost_saving = 0
    let total_co2_saving = 0

    bookings.forEach(booking => {
      // Basic compatibility checks
      if (
        container.container_type !== booking.required_container_type ||
        container.shipping_line_org_id !== booking.shipping_line_org_id ||
        new Date(container.available_from_datetime) >= new Date(booking.needed_by_datetime)
      ) {
        return
      }

      // Calculate distance (example - replace with actual distance calculation)
      const distanceKm = 20 // Example distance

      // Determine scenario
      const scenario = {
        isStreetTurnAtDepot: container.drop_off_location === booking.pick_up_location,
        isStreetTurnOnRoad: true, // Default to true for now
        isDifferentCarrier: container.trucking_company_org_id !== booking.trucking_company_org_id,
        isSameShippingLine: container.shipping_line_org_id === booking.shipping_line_org_id,
        hasCOD: false, // Determine based on actual conditions
        hasVAS: false // Removed condition check since we don't have these fields
      }

      // Calculate matching score
      const matching_score = calculateMatchingScore(container, booking, distanceKm, scenario)

      // Only include if score is above threshold (e.g., 50)
      if (matching_score.total_score >= 50) {
        // Calculate estimated savings
        const cost_saving = 100 // Example value
        const co2_saving = 242 // Example value in kg

        compatibleBookings.push({
          ...booking,
          matching_score,
          estimated_cost_saving: cost_saving,
          estimated_co2_saving_kg: co2_saving
        })

        total_cost_saving += cost_saving
        total_co2_saving += co2_saving
      }
    })

    // Only create suggestion if there are compatible bookings
    if (compatibleBookings.length > 0) {
      // Sort bookings by score
      compatibleBookings.sort((a, b) => b.matching_score.total_score - a.matching_score.total_score)

      suggestions.push({
        import_container: container,
        export_bookings: compatibleBookings,
        total_estimated_cost_saving: total_cost_saving,
        total_estimated_co2_saving_kg: total_co2_saving
      })
    }
  })

  // Sort suggestions by total savings
  return suggestions.sort((a, b) => b.total_estimated_cost_saving - a.total_estimated_cost_saving)
} 