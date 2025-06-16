'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { City, Depot, CityOption, DepotOption } from '@/lib/types/location'

export function useCities() {
  const [cities, setCities] = useState<CityOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('cities')
          .select('id, name, is_major_city')
          .order('is_major_city', { ascending: false })
          .order('name', { ascending: true })

        if (error) {
          throw error
        }

        const cityOptions: CityOption[] = (data || []).map((city: any) => ({
          value: city.id,
          label: city.name,
          isMajorCity: city.is_major_city
        }))

        setCities(cityOptions)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching cities:', err)
        setError(err.message || 'Có lỗi xảy ra khi tải danh sách thành phố')
      } finally {
        setLoading(false)
      }
    }

    fetchCities()
  }, [])

  return { cities, loading, error }
}

export function useDepots(cityId: string | null) {
  const [depots, setDepots] = useState<DepotOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!cityId) {
      setDepots([])
      setLoading(false)
      return
    }

    const fetchDepots = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('depots')
          .select('id, name, address, latitude, longitude')
          .eq('city_id', cityId)
          .order('name', { ascending: true })

        if (error) {
          throw error
        }

        const depotOptions: DepotOption[] = (data || []).map((depot: any) => ({
          value: depot.id,
          label: depot.name,
          address: depot.address || undefined,
          latitude: depot.latitude || undefined,
          longitude: depot.longitude || undefined
        }))

        setDepots(depotOptions)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching depots:', err)
        setError(err.message || 'Có lỗi xảy ra khi tải danh sách depot')
      } finally {
        setLoading(false)
      }
    }

    fetchDepots()
  }, [cityId])

  return { depots, loading, error }
}

// Hook để lấy thông tin depot cụ thể
export function useDepotDetails(depotId: string | null) {
  const [depot, setDepot] = useState<Depot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!depotId) {
      setDepot(null)
      setLoading(false)
      return
    }

    const fetchDepotDetails = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('depots')
          .select(`
            id,
            name,
            address,
            latitude,
            longitude,
            city_id,
            created_at,
            updated_at,
            city:cities(id, name, is_major_city)
          `)
          .eq('id', depotId)
          .single()

        if (error) {
          throw error
        }

        setDepot(data as any)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching depot details:', err)
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin depot')
      } finally {
        setLoading(false)
      }
    }

    fetchDepotDetails()
  }, [depotId])

  return { depot, loading, error }
} 