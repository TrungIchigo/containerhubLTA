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

// Hook để lấy tất cả depots từ cả hai bảng depots và gpg_depots
export function useAllDepots() {
  const [depots, setDepots] = useState<(DepotOption & { cityName?: string; isMajorCity?: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllDepots = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Lấy depots từ bảng depots với thông tin city
        const { data: regularDepots, error: regularError } = await supabase
          .from('depots')
          .select(`
            id,
            name,
            address,
            latitude,
            longitude,
            city:cities(id, name, is_major_city)
          `)
          .order('name', { ascending: true })

        if (regularError) {
          console.warn('Error fetching regular depots:', regularError)
        }

        // Lấy depots từ bảng gpg_depots
        const { data: gpgDepots, error: gpgError } = await supabase
          .from('gpg_depots')
          .select('id, name, address, latitude, longitude')
          .order('name', { ascending: true })

        if (gpgError) {
          console.warn('Error fetching GPG depots:', gpgError)
        }

        // Kết hợp và chuyển đổi dữ liệu
        const allDepots: (DepotOption & { cityName?: string; isMajorCity?: boolean })[] = []

        // Thêm regular depots
        if (regularDepots) {
          regularDepots.forEach((depot: any) => {
            allDepots.push({
              value: depot.id,
              label: depot.name,
              address: depot.address || undefined,
              latitude: depot.latitude || undefined,
              longitude: depot.longitude || undefined,
              cityName: depot.city?.name,
              isMajorCity: depot.city?.is_major_city || false
            })
          })
        }

        // Thêm GPG depots với prefix để phân biệt
        if (gpgDepots) {
          gpgDepots.forEach((depot: any) => {
            allDepots.push({
              value: `gpg_${depot.id}`,
              label: `${depot.name} (GPG)`,
              address: depot.address || undefined,
              latitude: depot.latitude || undefined,
              longitude: depot.longitude || undefined,
              cityName: 'GPG Network',
              isMajorCity: true // Treat GPG as major for sorting
            })
          })
        }

        // Sắp xếp: GPG depots trước, sau đó major cities, cuối cùng theo tên
        allDepots.sort((a, b) => {
          if (a.cityName === 'GPG Network' && b.cityName !== 'GPG Network') return -1
          if (a.cityName !== 'GPG Network' && b.cityName === 'GPG Network') return 1
          if (a.isMajorCity && !b.isMajorCity) return -1
          if (!a.isMajorCity && b.isMajorCity) return 1
          return a.label.localeCompare(b.label)
        })

        setDepots(allDepots)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching all depots:', err)
        setError(err.message || 'Có lỗi xảy ra khi tải danh sách depot')
      } finally {
        setLoading(false)
      }
    }

    fetchAllDepots()
  }, [])

  return { depots, loading, error }
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