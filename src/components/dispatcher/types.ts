import type { ImportContainer, ExportBooking } from '@/lib/types'

export interface MatchingScore {
  total_score: number
  distance_score: number
  time_score: number
  complexity_score: number
  quality_score: number
  partner_score?: number
}

export interface ExportBookingWithScore extends ExportBooking {
  matching_score: MatchingScore
  estimated_cost_saving: number
  estimated_co2_saving_kg: number
  scenario_type?: string
  required_actions?: string[]
  additional_fees?: Array<{
    type: string
    amount: number
  }>
}

export interface MatchSuggestion {
  import_container: ImportContainer & {
    shipping_line?: {
      id: string
      name: string
    }
  }
  export_bookings: ExportBookingWithScore[]
  total_estimated_cost_saving: number
  total_estimated_co2_saving_kg: number
}

export interface MatchSuggestionsProps {
  suggestions: MatchSuggestion[]
} 