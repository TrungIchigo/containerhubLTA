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

export function useGpgDepots(originDepotId?: string | null) {
  const [depots, setDepots] = useState<DepotOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDepots = async () => {
      try {
        setLoading(true)
        setError(null)
        const supabase = createClient()
        
        console.log('🔍 fetchDepots called with originDepotId:', originDepotId)
        
        let data: any[] = []

        // Nếu có originDepotId, lấy các depot có trong ma trận phí COD
        if (originDepotId) {
          console.log('📍 Fetching destination depots for origin:', originDepotId)
          
          // Lấy danh sách destination depot IDs
          const feeMatrixResult = await supabase
            .from('gpg_cod_fee_matrix')
            .select('destination_depot_id')
            .eq('origin_depot_id', originDepotId)

          console.log('📊 Fee matrix result:', feeMatrixResult)

          if (feeMatrixResult.error) {
            console.warn('⚠️ Error fetching fee matrix, will fallback to all GPG depots:', feeMatrixResult.error)
          } else {
            const destinationDepotIds = feeMatrixResult.data?.map(row => row.destination_depot_id) || []
            console.log('🎯 Destination depot IDs:', destinationDepotIds)

            if (destinationDepotIds.length > 0) {
              // Lấy thông tin chi tiết của các depots
              const depotsResult = await supabase
                .from('gpg_depots')
                .select('id, name, address, latitude, longitude')
                .in('id', destinationDepotIds)
                .order('name', { ascending: true })

              console.log('🏢 Depots result:', depotsResult)

              if (!depotsResult.error && depotsResult.data) {
                data = depotsResult.data
              }
            }
          }
        }

        // Nếu không có data (không có originDepotId hoặc không tìm thấy từ fee matrix), 
        // fallback sang tất cả GPG depots
        if (data.length === 0) {
          console.log('📍 Fetching all GPG depots as fallback')
          
          const result = await supabase
            .from('gpg_depots')
            .select('id, name, address, latitude, longitude')
            .order('name', { ascending: true })

          console.log('🏢 All GPG depots result:', result)

          if (result.error) {
            throw result.error
          }

          data = result.data || []
        }

        console.log('✅ Final depot data:', data)

        // Chuyển đổi dữ liệu từ bảng gpg_depots (cho cả hai trường hợp)
        const depotOptions = data.map(depot => ({
          value: depot.id,
          label: depot.name,
          address: depot.address || undefined,
          latitude: depot.latitude || undefined,
          longitude: depot.longitude || undefined
        }))

        console.log('🔄 Converted depot options:', depotOptions)

        setDepots(depotOptions)
        setError(null)
      } catch (err: any) {
        console.error('❌ Error fetching GPG depots:', err)
        console.error('Error details:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code
        })
        setError(err.message || 'Có lỗi xảy ra khi tải danh sách depot GPG')
      } finally {
        setLoading(false)
      }
    }

    fetchDepots()
  }, [originDepotId])

  return { depots, loading, error }
} 