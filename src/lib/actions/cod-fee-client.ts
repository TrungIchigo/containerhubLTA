import { createClient } from '@/lib/supabase/client'

export interface CodFeeResult {
  success: boolean
  fee?: number
  message?: string
}

export function formatCodFee(fee: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(fee)
}

/**
 * Calculate COD fee from any depot to GPG depot
 * @param originDepotId - ID của depot gốc (có thể là bất kỳ depot nào)
 * @param destinationDepotId - ID của depot đích (phải là GPG depot)
 */
export async function getCodFeeClient(originDepotId: string, destinationDepotId: string): Promise<CodFeeResult> {
  try {
    console.log('🔍 Calculating COD fee for:', { originDepotId, destinationDepotId })
    
    if (!originDepotId || !destinationDepotId) {
      console.log('❌ Missing depot IDs')
      return {
        success: false,
        message: 'Thiếu thông tin depot gốc hoặc depot đích'
      }
    }

    // Kiểm tra nếu 2 depot giống nhau
    if (originDepotId === destinationDepotId) {
      console.log('⚠️ Origin and destination depots are the same')
      return {
        success: false,
        message: 'Depot đích không thể trùng với depot gốc'
      }
    }

    const supabase = createClient()

    // Query trực tiếp bảng gpg_cod_fee_matrix và gpg_depots cùng lúc
    const [feeResponse, depotResponse] = await Promise.all([
      supabase
        .from('gpg_cod_fee_matrix')
        .select('fee, distance_km, road_distance_km')
        .eq('origin_depot_id', originDepotId)
        .eq('destination_depot_id', destinationDepotId)
        .maybeSingle(),
      supabase
        .from('gpg_depots')
        .select('id, name')
        .eq('id', destinationDepotId)
        .maybeSingle()
    ])

    // Kiểm tra depot đích có phải GPG depot không
    if (depotResponse.error) {
      console.error('❌ Error checking GPG depot:', depotResponse.error)
      return {
        success: false,
        message: 'Lỗi khi kiểm tra thông tin depot GPG: ' + depotResponse.error.message
      }
    }

    if (!depotResponse.data) {
      console.log('⚠️ Destination depot is not a GPG depot')
      return {
        success: false,
        message: 'Depot đích phải là depot thuộc GPG'
      }
    }

    console.log('✅ Found GPG depot:', depotResponse.data.name)

    // Xử lý kết quả tính phí
    if (feeResponse.error) {
      console.error('❌ Error fetching COD fee:', feeResponse.error)
      return {
        success: false,
        message: 'Lỗi khi tra cứu phí COD: ' + feeResponse.error.message
      }
    }

    // Nếu không tìm thấy phí theo chiều thuận, thử tìm theo chiều ngược
    if (!feeResponse.data) {
      console.log('⚠️ No fee data found, trying reverse lookup...')
      
      const { data: reverseFeeData, error: reverseFeeError } = await supabase
        .from('gpg_cod_fee_matrix')
        .select('fee, distance_km, road_distance_km')
        .eq('origin_depot_id', destinationDepotId)
        .eq('destination_depot_id', originDepotId)
        .maybeSingle()

      if (reverseFeeError) {
        console.error('❌ Error in reverse fee lookup:', reverseFeeError)
        return {
          success: false,
          message: 'Lỗi khi tra cứu phí COD ngược'
        }
      }

      if (reverseFeeData) {
        console.log('✅ Found fee in reverse lookup:', reverseFeeData.fee)
        return {
          success: true,
          fee: reverseFeeData.fee,
          message: `Khoảng cách: ${reverseFeeData.road_distance_km?.toFixed(2) || 'N/A'} km`
        }
      }

      return {
        success: false,
        message: 'Không tìm thấy biểu phí cho tuyến này'
      }
    }

    console.log('✅ Found COD fee:', feeResponse.data.fee)
    return {
      success: true,
      fee: feeResponse.data.fee,
      message: `Khoảng cách: ${feeResponse.data.road_distance_km?.toFixed(2) || 'N/A'} km`
    }

  } catch (error: any) {
    console.error('❌ Unexpected error in getCodFeeClient:', error)
    return {
      success: false,
      message: 'Có lỗi không mong muốn khi tính phí COD'
    }
  }
} 