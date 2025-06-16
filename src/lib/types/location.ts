export interface City {
  id: string
  name: string
  is_major_city: boolean
  created_at: string
  updated_at: string
}

export interface Depot {
  id: string
  name: string
  address: string | null
  city_id: string
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
  city?: City // Optional joined city data
}

export interface CityOption {
  value: string
  label: string
  isMajorCity: boolean
}

export interface DepotOption {
  value: string
  label: string
  address?: string
  latitude?: number
  longitude?: number
} 