// Database enums
export type OrganizationType = 'TRUCKING_COMPANY' | 'SHIPPING_LINE'
export type UserRole = 'DISPATCHER' | 'CARRIER_ADMIN'
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED'
export type AssetStatus = 'AVAILABLE' | 'AWAITING_APPROVAL' | 'CONFIRMED'

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
  requesting_org_id: string
  approving_org_id: string
  status: RequestStatus
  estimated_cost_saving: number | null
  estimated_co2_saving_kg: number | null
  created_at: string
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
  requesting_org: Organization
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
  drop_off_location: string
  available_from_datetime: string
  shipping_line_org_id: string
}

export interface CreateExportBookingForm {
  booking_number: string
  required_container_type: string
  pick_up_location: string
  needed_by_datetime: string
}

export interface CreateStreetTurnRequestForm {
  import_container_id: string
  export_booking_id: string
  approving_org_id: string
  estimated_cost_saving?: number
  estimated_co2_saving_kg?: number
} 