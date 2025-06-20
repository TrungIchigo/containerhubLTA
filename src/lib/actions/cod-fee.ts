import { createClient } from '@/lib/supabase/server'

export interface CodFeeResult {
  success: boolean
  fee?: number
  message?: string
}

/**
 * Get COD fee between two depots
 * @param originDepotId - Source depot ID
 * @param destinationDepotId - Destination depot ID
 * @returns COD fee in VND or error message
 */
export async function getCodFee(
  originDepotId: string,
  destinationDepotId: string
): Promise<CodFeeResult> {
  try {
    console.log('🔍 getCodFee called with:', { originDepotId, destinationDepotId })
    const supabase = await createClient()

    // If same depot, fee is 0
    if (originDepotId === destinationDepotId) {
      console.log('✅ Same depot, returning fee 0')
      return {
        success: true,
        fee: 0,
        message: 'Cùng depot - Không phí'
      }
    }

    // Query COD fee matrix
    console.log('🔍 Querying cod_fee_matrix table...')
    const { data, error } = await supabase
      .from('cod_fee_matrix')
      .select('fee, distance_km')
      .eq('origin_depot_id', originDepotId)
      .eq('destination_depot_id', destinationDepotId)
      .single()
    
    console.log('🔍 Database query result:', { data, error })

    if (error) {
      console.error('❌ Error fetching COD fee:', error)
      return {
        success: false,
        message: 'Không thể tính phí COD. Vui lòng thử lại.'
      }
    }

    if (!data) {
      console.log('❌ No data found for depot pair')
      return {
        success: false,
        message: 'Không tìm thấy thông tin phí COD cho tuyến đường này.'
      }
    }

    console.log('✅ COD fee found:', data.fee, 'VNĐ')
    return {
      success: true,
      fee: data.fee,
      message: data.distance_km ? `Khoảng cách: ${data.distance_km}km` : undefined
    }

  } catch (error) {
    console.error('❌ Unexpected error in getCodFee:', error)
    console.error('Error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    })
    return {
      success: false,
      message: 'Có lỗi xảy ra khi tính phí COD.'
    }
  }
}

/**
 * Get all COD fees for a specific origin depot
 * @param originDepotId - Source depot ID
 * @returns Array of COD fees to all destinations
 */
export async function getCodFeesForOrigin(originDepotId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cod_fee_matrix')
      .select(`
        fee,
        distance_km,
        destination_depot:depots!fk_destination_depot(
          id,
          name,
          address,
          city_id,
          cities(name)
        )
      `)
      .eq('origin_depot_id', originDepotId)
      .order('fee', { ascending: true })

    if (error) {
      console.error('Error fetching COD fees for origin:', error)
      return {
        success: false,
        message: 'Không thể tải danh sách phí COD.'
      }
    }

    return {
      success: true,
      data: data || []
    }

  } catch (error) {
    console.error('Unexpected error in getCodFeesForOrigin:', error)
    return {
      success: false,
      message: 'Có lỗi xảy ra khi tải danh sách phí COD.'
    }
  }
}

/**
 * Format COD fee for display
 * @param fee - Fee amount in VND
 * @returns Formatted fee string
 */
export function formatCodFee(fee: number): string {
  if (fee === 0) {
    return 'Miễn phí'
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(fee)
} 