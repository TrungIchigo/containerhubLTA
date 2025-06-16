import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CargoType, CargoClassificationOption } from '@/lib/types/cargo'

export function useCargoTypes() {
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCargoTypes() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error: fetchError } = await supabase
          .from('cargo_types')
          .select('*')
          .order('name', { ascending: true })

        if (fetchError) {
          throw fetchError
        }

        setCargoTypes(data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching cargo types:', err)
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách loại hàng hóa')
      } finally {
        setLoading(false)
      }
    }

    fetchCargoTypes()
  }, [])

  // Convert to select options format
  const cargoOptions: CargoClassificationOption[] = cargoTypes.map(type => ({
    value: type.id,
    label: type.name,
    description: type.description || undefined,
    requiresSpecialHandling: type.requires_special_handling
  }))

  return {
    cargoTypes,
    cargoOptions,
    loading,
    error,
    refresh: () => {
      setLoading(true)
      // Re-trigger the effect
      window.location.reload()
    }
  }
}

// Utility function to get cargo type by ID
export function useCargoTypeById(id: string | null) {
  const { cargoTypes, loading } = useCargoTypes()
  
  const cargoType = cargoTypes.find(type => type.id === id) || null
  
  return {
    cargoType,
    loading
  }
} 