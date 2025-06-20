import { createClient } from '@/lib/supabase/client'

export interface CodFeeResult {
  success: boolean
  fee?: number
  message?: string
}

/**
 * Client-side COD fee calculation
 * @param originDepotId - Source depot ID
 * @param destinationDepotId - Destination depot ID
 * @returns COD fee in VND or error message
 */
export async function getCodFeeClient(
  originDepotId: string,
  destinationDepotId: string
): Promise<CodFeeResult> {
  try {
    console.log('🔍 getCodFeeClient called with:', { originDepotId, destinationDepotId })
    const supabase = createClient()

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
    console.log('🔍 Querying cod_fee_matrix table from client...')
    const { data, error } = await supabase
      .from('cod_fee_matrix')
      .select('fee, distance_km')
      .eq('origin_depot_id', originDepotId)
      .eq('destination_depot_id', destinationDepotId)
      .single()
    
    console.log('🔍 Client database query result:', { data, error })

    if (error) {
      console.error('❌ Error fetching COD fee from client:', error)
      return {
        success: false,
        message: 'Không thể tính phí COD. Vui lòng thử lại.'
      }
    }

    if (!data) {
      console.log('❌ No data found for depot pair from client')
      return {
        success: false,
        message: 'Không tìm thấy thông tin phí COD cho tuyến đường này.'
      }
    }

    console.log('✅ COD fee found from client:', data.fee, 'VNĐ')
    return {
      success: true,
      fee: data.fee,
      message: data.distance_km ? `Khoảng cách: ${data.distance_km}km` : undefined
    }

  } catch (error) {
    console.error('❌ Unexpected error in getCodFeeClient:', error)
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