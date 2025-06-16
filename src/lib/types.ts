// Database enums
export type OrganizationType = 'TRUCKING_COMPANY' | 'SHIPPING_LINE'
export type UserRole = 'DISPATCHER' | 'CARRIER_ADMIN'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED'
export type AssetStatus = 'AVAILABLE' | 'AWAITING_APPROVAL' | 'AWAITING_COD_APPROVAL' | 'CONFIRMED'
export type PartyApprovalStatus = 'PENDING' | 'APPROVED' | 'DECLINED'
export type MatchType = 'INTERNAL' | 'MARKETPLACE'

// Database table types
export interface Organization {
  id: string
  name: string
  type: OrganizationType
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  organization_id: string | null
  role: UserRole
  updated_at: string | null
}

export interface ImportContainer {
  id: string
  container_number: string
  container_type: string
  drop_off_location: string
  available_from_datetime: string
  trucking_company_org_id: string
  shipping_line_org_id: string
  status: AssetStatus
  is_listed_on_marketplace: boolean
  latitude: number | null
  longitude: number | null
  created_at: string
}

export interface ExportBooking {
  id: string
  booking_number: string
  required_container_type: string
  pick_up_location: string
  needed_by_datetime: string
  trucking_company_org_id: string
  status: AssetStatus
  created_at: string
}

export interface StreetTurnRequest {
  id: string
  import_container_id: string
  export_booking_id: string
  dropoff_trucking_org_id: string
  pickup_trucking_org_id: string
  approving_org_id: string
  status: RequestStatus
  dropoff_org_approval_status: PartyApprovalStatus | null
  match_type: MatchType
  estimated_cost_saving: number | null
  estimated_co2_saving_kg: number | null
  auto_approved_by_rule_id: string | null
  created_at: string
}

export interface PartnerReview {
  id: string
  request_id: string
  reviewer_org_id: string
  reviewee_org_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface RatingDetails {
  average_rating: number
  review_count: number
}

// Extended types with relations for UI
export interface ImportContainerWithOrgs extends ImportContainer {
  trucking_company: Organization
  shipping_line: Organization
}

export interface ExportBookingWithOrg extends ExportBooking {
  trucking_company: Organization
}

export interface StreetTurnRequestWithDetails extends StreetTurnRequest {
  import_container: ImportContainerWithOrgs
  export_booking: ExportBookingWithOrg
  dropoff_trucking_org: Organization
  pickup_trucking_org: Organization
  approving_org: Organization
}

// Auth user type
export interface User {
  id: string
  email: string
  profile?: Profile & {
    organization?: Organization
  }
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Form types
export interface CreateImportContainerForm {
  container_number: string
  container_type: string
  cargo_type_id: string
  city_id: string
  depot_id: string
  available_from_datetime: string
  shipping_line_org_id: string
  condition_images: string[]
  attached_documents?: string[]
  is_listed_on_marketplace?: boolean
  latitude?: number
  longitude?: number
}

export interface CreateExportBookingForm {
  booking_number: string
  required_container_type: string
  cargo_type_id: string
  city_id: string
  depot_id: string
  needed_by_datetime: string
  attached_documents?: string[]
}

export interface CreateStreetTurnRequestForm {
  import_container_id: string
  export_booking_id: string
  approving_org_id: string
  estimated_cost_saving?: number
  estimated_co2_saving_kg?: number
}

// Marketplace specific types
export interface CreateMarketplaceRequestForm {
  dropoff_container_id: string
  pickup_booking_id: string
  estimated_cost_saving?: number
  estimated_co2_saving_kg?: number
}

export interface MarketplaceListing {
  id: string
  container_number: string
  container_type: string
  drop_off_location: string
  available_from_datetime: string
  shipping_line: Organization
  trucking_company: Organization
  latitude: number | null
  longitude: number | null
  estimated_cost_saving?: number
  estimated_co2_saving_kg?: number
  rating_details?: RatingDetails
}

// Marketplace filters
export interface MarketplaceFilters {
  container_type?: string
  shipping_line_name?: string
  location?: string
  max_distance_km?: number
  min_rating?: number
  start_date?: string
  end_date?: string
}

// COD (Change of Destination) types
export type CodRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'AWAITING_INFO' | 'EXPIRED' | 'REVERSED'
export type AuditLogAction = 'CREATED' | 'APPROVED' | 'DECLINED' | 'INFO_REQUESTED' | 'INFO_SUBMITTED' | 'EXPIRED' | 'REVERSED' | 'CANCELLED'

export interface CodRequest {
  id: string
  dropoff_order_id: string
  requesting_org_id: string
  approving_org_id: string
  original_depot_address: string
  requested_depot_id: string
  status: CodRequestStatus
  cod_fee: number | null
  reason_for_request: string | null
  reason_for_decision: string | null
  carrier_comment: string | null
  additional_info: string | null
  created_at: string
  updated_at: string | null
  expires_at: string | null
}

export interface CodAuditLog {
  id: string
  request_id: string
  actor_user_id: string | null
  actor_org_name: string
  action: AuditLogAction
  details: Record<string, any> | null
  created_at: string
}

// COD request with relations for UI
export interface CodRequestWithDetails extends CodRequest {
  import_container: ImportContainer
  requested_depot: {
    name: string
    address: string
  }
  requesting_org: Organization
  approving_org: Organization
} 