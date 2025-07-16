import type { AssetStatus } from '@/lib/types'

export interface ImportContainer {
  id: string
  container_number: string
  container_type: string
  container_type_id: string | null
  drop_off_location: string
  available_from_datetime: string
  trucking_company_org_id: string
  shipping_line_org_id: string
  status: AssetStatus
  is_listed_on_marketplace: boolean
  latitude: number | null
  longitude: number | null
  condition_images: string[] | null
  attached_documents: string[] | null
  city_id: string | null
  depot_id: string | null
  cargo_type_id: string | null
  created_at: string
  depot_name?: string // Optional field for UI display
} 