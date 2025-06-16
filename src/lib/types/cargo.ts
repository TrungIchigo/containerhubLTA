export interface CargoType {
  id: string
  name: string
  description: string | null
  requires_special_handling: boolean
  created_at: string
  updated_at: string
}

export interface CargoClassificationOption {
  value: string
  label: string
  description?: string
  requiresSpecialHandling: boolean
} 