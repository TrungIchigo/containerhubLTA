'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'
import { createCodServiceFee } from './billing'
import { can, Permission, type UserWithProfile } from '@/lib/authorization'
import { getCodFee } from './cod-fee'

// Types for COD requests
interface CreateCodRequestData {
  dropoff_order_id: string
  city_id: string
  depot_id: string
  reason_for_request: string
}

interface CodRequestResult {
  success: boolean
  message: string
  data?: any
}

// Create COD request - SERVER ACTION
export async function createCodRequest(data: CreateCodRequestData): Promise<CodRequestResult> {
  try {
    console.log('createCodRequest called with data:', data)
    
    // Validate input data
    if (!data.dropoff_order_id || !data.city_id || !data.depot_id) {
      console.error('Invalid input data:', {
        hasDropoffOrderId: !!data.dropoff_order_id,
        hasCityId: !!data.city_id,
        hasDepotId: !!data.depot_id
      })
      return {
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại.'
      }
    }
    
    const user = await getCurrentUser()
    console.log('Current user:', user?.profile)
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      console.error('Authorization failed:', { 
        hasUser: !!user, 
        hasProfile: !!user?.profile, 
        orgId: user?.profile?.organization_id,
        role: user?.profile?.role 
      })
      return {
        success: false,
        message: 'Unauthorized: Chỉ Dispatcher mới có thể tạo yêu cầu COD'
      }
    }

    const supabase = await createClient()
    const requestingOrgId = user.profile.organization_id

    // BƯỚC 1: Kiểm tra trạng thái container hiện tại
    const { data: container, error: containerError } = await supabase
      .from('import_containers')
      .select(`
        id,
        container_number,
        status,
        drop_off_location,
        shipping_line_org_id,
        trucking_company_org_id,
        city_id,
        depot_id
      `)
      .eq('id', data.dropoff_order_id)
      .single()

    if (containerError || !container) {
      console.error('Container lookup failed:', { containerError, hasContainer: !!container })
      return {
        success: false,
        message: 'Không tìm thấy container liên quan'
      }
    }
    
    console.log('Found container:', container)

    // Kiểm tra container có shipping_line_org_id
    if (!container.shipping_line_org_id) {
      console.error('Container missing shipping_line_org_id:', container)
      return {
        success: false,
        message: 'Container này chưa được gán hãng tàu. Không thể tạo yêu cầu COD.'
      }
    }

    // Kiểm tra container thuộc về công ty hiện tại
    if (container.trucking_company_org_id !== requestingOrgId) {
      console.error('Container ownership mismatch:', { 
        containerOrgId: container.trucking_company_org_id, 
        requestingOrgId 
      })
      return {
        success: false,
        message: 'Container này không thuộc về công ty của bạn'
      }
    }

    // Kiểm tra trạng thái container
    if (container.status !== 'AVAILABLE') {
      console.error('Container status invalid:', { 
        currentStatus: container.status, 
        requiredStatus: 'AVAILABLE' 
      })
      return {
        success: false,
        message: 'Thao tác không thể thực hiện. Container này không ở trạng thái sẵn sàng.'
      }
    }

    // BƯỚC 2: Lấy thông tin depot mới
    const { data: newDepot, error: depotError } = await supabase
      .from('depots')
      .select('id, name, address, city_id')
      .eq('id', data.depot_id)
      .single()

    if (depotError || !newDepot) {
      console.error('Depot lookup failed:', { depotError, hasDepot: !!newDepot, depotId: data.depot_id })
      return {
        success: false,
        message: 'Depot mới không hợp lệ hoặc không tồn tại'
      }
    }
    
    console.log('Found new depot:', newDepot)

    // Kiểm tra city_id khớp với depot
    if (newDepot.city_id !== data.city_id) {
      return {
        success: false,
        message: 'Depot không thuộc thành phố đã chọn'
      }
    }

    // Kiểm tra không trùng với depot hiện tại
    if (container.depot_id === data.depot_id) {
      return {
        success: false,
        message: 'Depot mới không thể trùng với depot hiện tại'
      }
    }

    // BƯỚC 2.5: Kiểm tra xem đã có COD request pending cho container này chưa
    const { data: existingRequest, error: checkError } = await supabase
      .from('cod_requests')
      .select('id, status')
      .eq('dropoff_order_id', data.dropoff_order_id)
      .in('status', ['PENDING', 'AWAITING_INFO'])
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing COD requests:', checkError)
      return {
        success: false,
        message: 'Không thể kiểm tra yêu cầu COD hiện tại'
      }
    }

    if (existingRequest) {
      console.log('Found existing COD request:', existingRequest)
      return {
        success: false,
        message: 'Container này đã có yêu cầu COD đang chờ xử lý'
      }
    }

    // BƯỚC 3: Tính toán phí COD tự động
    let calculatedCodFee = 0
    console.log('=== COD FEE CALCULATION START ===')
    console.log('Container depot_id:', container.depot_id)
    console.log('Requested depot_id:', data.depot_id)
    
    try {
      if (container.depot_id && data.depot_id) {
        console.log('Both depot IDs available, calling getCodFee...')
        const feeResult = await getCodFee(container.depot_id, data.depot_id)
        console.log('getCodFee result:', JSON.stringify(feeResult, null, 2))
        
        if (feeResult.success && typeof feeResult.fee === 'number') {
          calculatedCodFee = feeResult.fee
          console.log('✅ COD fee successfully calculated:', calculatedCodFee, 'VNĐ')
        } else {
          console.log('❌ COD fee calculation failed:', feeResult.message || 'Unknown error')
        }
      } else {
        console.log('❌ Missing depot IDs:', { 
          containerDepot: container.depot_id, 
          requestedDepot: data.depot_id 
        })
      }
    } catch (error) {
      console.error('❌ Exception in COD fee calculation:', error)
      console.error('Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      })
    }
    
    console.log('=== COD FEE CALCULATION END ===')
    console.log('Final calculatedCodFee:', calculatedCodFee, 'VNĐ')

    // BƯỚC 4: Tạo yêu cầu COD với phí đã tính
    const codRequestData = {
      dropoff_order_id: data.dropoff_order_id,
      requesting_org_id: requestingOrgId,
      approving_org_id: container.shipping_line_org_id,
      original_depot_address: container.drop_off_location,
      requested_depot_id: data.depot_id,
      reason_for_request: data.reason_for_request,
      cod_fee: calculatedCodFee, // Lưu phí COD tự động tính
      status: 'PENDING'
    }
    
    console.log('Creating COD request with data:', codRequestData)
    console.log('Current user details:', {
      userId: user.id,
      userRole: user.profile?.role,
      orgId: user.profile?.organization_id,
      orgRole: user.profile?.organization_role
    })
    
    const { data: codRequest, error: codError } = await supabase
      .from('cod_requests')
      .insert(codRequestData)
      .select()
      .single()

    if (codError) {
      console.error('❌ Error creating COD request:', codError)
      console.error('COD request data that failed:', codRequestData)
      console.error('Supabase error details:', {
        code: codError.code,
        message: codError.message,
        details: codError.details,
        hint: codError.hint
      })
      
      // Return more specific error message
      let errorMessage = 'Không thể tạo yêu cầu COD.'
      
      // Handle specific error codes
      if (codError.code === '23505') {
        errorMessage = 'Yêu cầu COD đã tồn tại cho container này.'
      } else if (codError.code === '23503') {
        errorMessage = 'Dữ liệu tham chiếu không hợp lệ (depot hoặc organization).'
      } else if (codError.code === '42501') {
        errorMessage = 'Không có quyền tạo yêu cầu COD. Vui lòng kiểm tra vai trò người dùng.'
      } else if (codError.message?.includes('row-level security')) {
        errorMessage = 'Vi phạm chính sách bảo mật. Vui lòng kiểm tra quyền truy cập.'
      } else if (codError.message) {
        errorMessage = `Lỗi database: ${codError.message}`
      }
      
      return {
        success: false,
        message: errorMessage
      }
    }
    
    console.log('COD request created successfully:', codRequest)

    // BƯỚC 5: Cập nhật trạng thái container thành AWAITING_COD_APPROVAL
    const { error: updateError } = await supabase
      .from('import_containers')
      .update({ status: 'AWAITING_COD_APPROVAL' })
      .eq('id', data.dropoff_order_id)

    if (updateError) {
      console.error('Error updating container status:', updateError)
      
      // Rollback: Xóa yêu cầu COD vừa tạo
      await supabase
        .from('cod_requests')
        .delete()
        .eq('id', codRequest.id)

      return {
        success: false,
        message: 'Không thể cập nhật trạng thái container. Vui lòng thử lại.'
      }
    }

    // BƯỚC 6: Ghi audit log
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', requestingOrgId)
      .single()

    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: codRequest.id,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'CREATED',
        details: {
          container_number: container.container_number,
          original_depot: container.drop_off_location,
          requested_depot: newDepot.name,
          reason: data.reason_for_request,
          cod_fee: calculatedCodFee
        }
      })

    // BƯỚC 7: Revalidate các trang liên quan
    revalidatePath('/dispatcher')
    revalidatePath('/dispatcher/requests')
    revalidatePath('/carrier-admin')

    return {
      success: true,
      message: `Đã gửi yêu cầu thay đổi nơi trả container ${container.container_number} thành công!`,
      data: {
        requestId: codRequest.id,
        containerNumber: container.container_number,
        newDepotName: newDepot.name,
        codFee: calculatedCodFee
      }
    }

  } catch (error: any) {
    console.error('Error in createCodRequest:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack
    })
    
    return {
      success: false,
      message: `Có lỗi hệ thống xảy ra: ${error.message || 'Vui lòng thử lại sau.'}`
    }
  }
}

// Get COD requests for dispatcher
export async function getCodRequests() {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      throw new Error('Unauthorized')
    }

    const supabase = await createClient()
    
    const { data: requests, error } = await supabase
      .from('cod_requests')
      .select(`
        *,
        import_container:import_containers!dropoff_order_id(
          container_number,
          container_type,
          drop_off_location
        ),
        requested_depot:depots!requested_depot_id(
          name,
          address
        ),
        approving_org:organizations!approving_org_id(
          name
        )
      `)
      .eq('requesting_org_id', user.profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching COD requests:', error)
      throw error
    }

    return requests || []

  } catch (error: any) {
    console.error('Error in getCodRequests:', error)
    throw new Error('Failed to fetch COD requests')
  }
}

// Get COD requests for admin (Platform Admin hoặc Carrier Admin legacy)
export async function getCarrierCodRequests() {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      throw new Error('Unauthorized - No user ID')
    }

    console.log('🔍 getCarrierCodRequests - User:', user.profile?.role, user.profile?.organization?.name)

    // Simple role check for debugging
    if (user.profile?.role !== 'CARRIER_ADMIN' && user.profile?.role !== 'PLATFORM_ADMIN') {
      throw new Error(`Unauthorized - Invalid role: ${user.profile?.role}`)
    }

    const supabase = await createClient()
    
    // Platform Admin có thể xem tất cả yêu cầu, Carrier Admin chỉ xem của tổ chức mình
    let query = supabase
      .from('cod_requests')
      .select(`
        *,
        import_container:import_containers!cod_requests_container_id_fkey(
          id,
          container_number,
          container_type,
          drop_off_location
        ),
        requested_depot:depots!cod_requests_requested_depot_id_fkey(
          id,
          name,
          address,
          city
        ),
        requesting_org:organizations!cod_requests_requesting_org_id_fkey(
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    // Chỉ lọc theo organization nếu không phải Platform Admin
    if (user.profile?.role !== 'PLATFORM_ADMIN' && user.profile?.organization_id) {
      query = query.eq('approving_org_id', user.profile.organization_id)
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching carrier COD requests:', error)
      throw error
    }

    return requests || []

  } catch (error: any) {
    console.error('Error in getCarrierCodRequests:', error)
    throw new Error('Failed to fetch carrier COD requests')
  }
}

// Handle COD decision (approve/decline) - SERVER ACTION
export async function handleCodDecision(
  requestId: string, 
  decision: 'APPROVED' | 'DECLINED',
  codFee?: number,
  reasonForDecision?: string
): Promise<CodRequestResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập.'
      }
    }

    const userWithProfile: UserWithProfile = { 
      id: user.id, 
      email: user.email, 
      profile: user.profile 
    }
    
    // BƯỚC BẢO VỆ MỚI - Sử dụng authorization layer tập trung
    if (!can(userWithProfile, Permission.APPROVE_ANY_REQUEST)) {
      return {
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này.'
      }
    }

    const supabase = await createClient()

    // BƯỚC 1: Lấy thông tin yêu cầu COD và kiểm tra trạng thái
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select(`
        id,
        status,
        cod_fee,
        dropoff_order_id,
        requesting_org_id,
        approving_org_id,
        requested_depot_id,
        import_container:import_containers!dropoff_order_id(
          container_number,
          status
        ),
        requested_depot:depots!requested_depot_id(
          name,
          address,
          latitude,
          longitude
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !codRequest) {
      return {
        success: false,
        message: 'Không tìm thấy yêu cầu COD'
      }
    }

    // Kiểm tra quyền xử lý
    if (codRequest.approving_org_id !== user.profile.organization_id) {
      return {
        success: false,
        message: 'Bạn không có quyền xử lý yêu cầu này'
      }
    }

    // Kiểm tra trạng thái yêu cầu
    if (codRequest.status !== 'PENDING' && codRequest.status !== 'AWAITING_INFO') {
      return {
        success: false,
        message: 'Thao tác không thể thực hiện. Yêu cầu này đã được xử lý hoặc bị hủy.'
      }
    }

    // BƯỚC 2: Xử lý theo quyết định
    if (decision === 'DECLINED') {
      // Từ chối yêu cầu
      const { error: updateError } = await supabase
        .from('cod_requests')
        .update({
          status: 'DECLINED',
          reason_for_decision: reasonForDecision,
          updated_at: new Date().toISOString(),
          declined_at: new Date().toISOString() // Add timestamp tracking
        })
        .eq('id', requestId)

      if (updateError) {
        console.error('Error declining COD request:', updateError)
        return {
          success: false,
          message: 'Không thể từ chối yêu cầu. Vui lòng thử lại.'
        }
      }

      // Rollback trạng thái container về AVAILABLE
      const { error: rollbackError } = await supabase
        .from('import_containers')
        .update({ status: 'AVAILABLE' })
        .eq('id', codRequest.dropoff_order_id)

      if (rollbackError) {
        console.error('Error rolling back container status:', rollbackError)
        return {
          success: false,
          message: 'Không thể cập nhật trạng thái container. Vui lòng thử lại.'
        }
      }

    } else {
      // BƯỚC 2.1: Phê duyệt yêu cầu - Stage 3 -> Stage 4 (APPROVED)
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', user.profile.organization_id)
        .single()

      // Xác định phí COD cuối cùng: sử dụng phí admin nhập hoặc giữ phí đã tính
      const finalCodFee = codFee !== undefined ? codFee : (codRequest.cod_fee || 0)

      console.log('Calling approve_cod_request with params:', {
        request_id: requestId,
        cod_fee: finalCodFee,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization'
      })

      // BƯỚC 2.2: Cập nhật COD request thành APPROVED với timestamp
      const { error: codUpdateError } = await supabase
        .from('cod_requests')
        .update({
          status: 'APPROVED',
          cod_fee: finalCodFee,
          reason_for_decision: reasonForDecision || 'Approved by admin',
          updated_at: new Date().toISOString(),
          approved_at: new Date().toISOString() // Add approval timestamp
        })
        .eq('id', requestId)

      if (codUpdateError) {
        console.error('Error updating COD request:', codUpdateError)
        return {
          success: false,
          message: 'Không thể phê duyệt yêu cầu. Vui lòng thử lại.'
        }
      }

      // BƯỚC 2.3: Update container location nhưng giữ status là AWAITING_COD_APPROVAL
      // Container sẽ đợi delivery confirmation từ dispatcher
      const depot = Array.isArray(codRequest.requested_depot) ? codRequest.requested_depot[0] : codRequest.requested_depot
      
      console.log('Updating container with new location:', {
        container_id: codRequest.dropoff_order_id,
        depot_id: codRequest.requested_depot_id,
        depot_name: depot.name,
        depot_address: depot.address
      })

      const { error: containerUpdateError } = await supabase
        .from('import_containers')
        .update({
          depot_id: codRequest.requested_depot_id,
          drop_off_location: `${depot.name}, ${depot.address}`,
          latitude: depot.latitude,
          longitude: depot.longitude,
          // Keep status as AWAITING_COD_APPROVAL until delivery is confirmed
          // This prevents the container from being used in other transactions
          status: 'AWAITING_COD_APPROVAL'
        })
        .eq('id', codRequest.dropoff_order_id)

      if (containerUpdateError) {
        console.error('Container update failed:', containerUpdateError)
        return {
          success: false,
          message: `Không thể cập nhật container. Lỗi: ${containerUpdateError.message}. Vui lòng liên hệ admin.`
        }
      }

      // BƯỚC 2.4: Tạo phí dịch vụ COD cho i-ContainerHub nếu có phí
      if (finalCodFee && finalCodFee > 0) {
        const container = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
        const billingResult = await createCodServiceFee(
          codRequest.requesting_org_id,
          requestId,
          container?.container_number
        )

        if (!billingResult.success) {
          console.error('Warning: Không thể tạo phí dịch vụ COD:', billingResult.error)
          // Không return error vì COD đã được approved thành công
        }
      }

      // BƯỚC 2.5: Ghi audit log cho APPROVED
      const container = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
      await supabase
        .from('cod_audit_logs')
        .insert({
          request_id: requestId,
          actor_user_id: user.id,
          actor_org_name: orgData?.name || 'Unknown Organization',
          action: 'APPROVED',
          details: {
            container_number: container?.container_number,
            decision: 'APPROVED',
            cod_fee: finalCodFee,
            depot_name: depot?.name,
            depot_address: depot?.address,
            reason_for_decision: reasonForDecision
          }
        })

      // Revalidate các trang liên quan cho APPROVED
      revalidatePath('/carrier-admin')
      revalidatePath('/dispatcher')
      revalidatePath('/dispatcher/requests')

      // Success message for approved COD
      return {
        success: true,
        message: `Đã phê duyệt yêu cầu COD cho container ${container?.container_number}${finalCodFee > 0 ? ` với phí ${finalCodFee.toLocaleString('vi-VN')} VNĐ` : ' miễn phí'}. Container đang chờ xác nhận giao hàng.`
      }
    }

    // BƯỚC 3: Ghi audit log cho DECLINED
    const container = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()

    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: requestId,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'DECLINED',
        details: {
          container_number: container?.container_number,
          decision: 'DECLINED',
          reason_for_decision: reasonForDecision
        }
      })

    // BƯỚC 4: Revalidate các trang liên quan cho DECLINED
    revalidatePath('/carrier-admin')
    revalidatePath('/dispatcher')
    revalidatePath('/dispatcher/requests')

    return {
      success: true,
      message: `Đã từ chối yêu cầu COD cho container ${container?.container_number}`
    }

  } catch (error: any) {
    console.error('Error in handleCodDecision:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
}

// Request more information - SERVER ACTION
export async function requestMoreInfo(requestId: string, carrierComment: string): Promise<CodRequestResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
      return {
        success: false,
        message: 'Unauthorized'
      }
    }

    const supabase = await createClient()

    // Lấy thông tin yêu cầu COD
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select('id, status, approving_org_id, import_container:import_containers!dropoff_order_id(container_number)')
      .eq('id', requestId)
      .single()

    if (fetchError || !codRequest) {
      return {
        success: false,
        message: 'Không tìm thấy yêu cầu COD'
      }
    }

    // Kiểm tra quyền
    if (codRequest.approving_org_id !== user.profile.organization_id) {
      return {
        success: false,
        message: 'Bạn không có quyền xử lý yêu cầu này'
      }
    }

    // Kiểm tra trạng thái
    if (codRequest.status !== 'PENDING') {
      return {
        success: false,
        message: 'Chỉ có thể yêu cầu bổ sung thông tin cho yêu cầu đang chờ duyệt'
      }
    }

    // Cập nhật trạng thái và comment
    const { error: updateError } = await supabase
      .from('cod_requests')
      .update({
        status: 'AWAITING_INFO',
        carrier_comment: carrierComment,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error requesting more info:', updateError)
      return {
        success: false,
        message: 'Không thể gửi yêu cầu bổ sung. Vui lòng thử lại.'
      }
    }

    // Ghi audit log
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()

    const requestContainer = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: requestId,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'INFO_REQUESTED',
        details: {
          container_number: requestContainer?.container_number,
          carrier_comment: carrierComment
        }
      })

    // Revalidate pages
    revalidatePath('/carrier-admin')
    revalidatePath('/dispatcher/requests')

    return {
      success: true,
      message: `Đã gửi yêu cầu bổ sung thông tin cho container ${requestContainer?.container_number}`
    }

  } catch (error: any) {
    console.error('Error in requestMoreInfo:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
}

// Submit additional information - SERVER ACTION
export async function submitAdditionalInfo(requestId: string, additionalInfo: string): Promise<CodRequestResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      return {
        success: false,
        message: 'Unauthorized: Chỉ Dispatcher mới có thể cập nhật thông tin'
      }
    }

    const supabase = await createClient()

    // Lấy thông tin yêu cầu COD
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select(`
        id, 
        status, 
        requesting_org_id,
        import_container:import_containers!dropoff_order_id(
          container_number
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !codRequest) {
      return {
        success: false,
        message: 'Không tìm thấy yêu cầu COD'
      }
    }

    // Kiểm tra quyền cập nhật
    if (codRequest.requesting_org_id !== user.profile.organization_id) {
      return {
        success: false,
        message: 'Bạn không có quyền cập nhật yêu cầu này'
      }
    }

    // Kiểm tra trạng thái yêu cầu
    if (codRequest.status !== 'AWAITING_INFO') {
      return {
        success: false,
        message: 'Chỉ có thể cập nhật thông tin cho yêu cầu đang chờ bổ sung thông tin'
      }
    }

    // Cập nhật thông tin bổ sung và chuyển trạng thái về PENDING
    const { error: updateError } = await supabase
      .from('cod_requests')
      .update({
        status: 'PENDING',
        additional_info: additionalInfo,
        updated_at: new Date().toISOString(),
        // Reset expires_at to 24h from now
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating COD request:', updateError)
      return {
        success: false,
        message: 'Không thể cập nhật thông tin. Vui lòng thử lại.'
      }
    }

    // Ghi audit log
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()

    const submitContainer = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: requestId,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'INFO_SUBMITTED',
        details: {
          container_number: submitContainer?.container_number,
          additional_info: additionalInfo
        }
      })

    // Revalidate pages
    revalidatePath('/dispatcher/requests')
    revalidatePath('/carrier-admin')

    return {
      success: true,
      message: `Đã gửi thông tin bổ sung cho container ${submitContainer?.container_number}. Yêu cầu chuyển về trạng thái chờ duyệt.`
    }

  } catch (error: any) {
    console.error('Error in submitAdditionalInfo:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
}

// Cancel COD request (only for PENDING status)
export async function cancelCodRequest(requestId: string): Promise<CodRequestResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      return {
        success: false,
        message: 'Unauthorized'
      }
    }

    const supabase = await createClient()

    // Lấy thông tin yêu cầu COD
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select('id, status, dropoff_order_id, requesting_org_id')
      .eq('id', requestId)
      .single()

    if (fetchError || !codRequest) {
      return {
        success: false,
        message: 'Không tìm thấy yêu cầu COD'
      }
    }

    // Kiểm tra quyền hủy
    if (codRequest.requesting_org_id !== user.profile.organization_id) {
      return {
        success: false,
        message: 'Bạn không có quyền hủy yêu cầu này'
      }
    }

    // Chỉ cho phép hủy yêu cầu PENDING hoặc AWAITING_INFO
    if (codRequest.status !== 'PENDING' && codRequest.status !== 'AWAITING_INFO') {
      return {
        success: false,
        message: 'Chỉ có thể hủy yêu cầu đang chờ duyệt hoặc chờ bổ sung thông tin'
      }
    }

    // Xóa yêu cầu COD
    const { error: deleteError } = await supabase
      .from('cod_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error deleting COD request:', deleteError)
      return {
        success: false,
        message: 'Không thể hủy yêu cầu. Vui lòng thử lại.'
      }
    }

    // Rollback trạng thái container về AVAILABLE
    const { error: rollbackError } = await supabase
      .from('import_containers')
      .update({ status: 'AVAILABLE' })
      .eq('id', codRequest.dropoff_order_id)

    if (rollbackError) {
      console.error('Error rolling back container status:', rollbackError)
    }

    // Ghi audit log
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()

    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: requestId,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'CANCELLED',
        details: {
          reason: 'Cancelled by requesting organization'
        }
      })

    // Revalidate pages
    revalidatePath('/dispatcher')
    revalidatePath('/dispatcher/requests')

    return {
      success: true,
      message: 'Đã hủy yêu cầu COD thành công'
    }

  } catch (error: any) {
    console.error('Error in cancelCodRequest:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
}

// Stage 5: Dispatcher confirms delivery completion - SERVER ACTION  
export async function confirmCodDelivery(requestId: string): Promise<CodRequestResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      return {
        success: false,
        message: 'Chỉ Dispatcher mới có thể xác nhận giao hàng.'
      }
    }

    const supabase = await createClient()

    // Lấy thông tin yêu cầu COD
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select(`
        id, 
        status, 
        requesting_org_id,
        dropoff_order_id,
        cod_fee,
        import_container:import_containers!dropoff_order_id(
          container_number
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !codRequest) {
      return {
        success: false,
        message: 'Không tìm thấy yêu cầu COD'
      }
    }

    // Kiểm tra quyền xác nhận
    if (codRequest.requesting_org_id !== user.profile.organization_id) {
      return {
        success: false,
        message: 'Bạn không có quyền xác nhận yêu cầu này'
      }
    }

    // Kiểm tra trạng thái - chỉ cho phép confirm từ APPROVED
    if (codRequest.status !== 'APPROVED') {
      return {
        success: false,
        message: 'Chỉ có thể xác nhận giao hàng cho yêu cầu đã được phê duyệt'
      }
    }

    // STAGE 5: Update status to PENDING_PAYMENT
    const { error: updateError } = await supabase
      .from('cod_requests')
      .update({
        status: 'PENDING_PAYMENT',
        delivery_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error confirming delivery:', updateError)
      return {
        success: false,
        message: 'Không thể xác nhận giao hàng. Vui lòng thử lại.'
      }
    }

    // Update container status to CONFIRMED (delivered to new location)
    const { error: containerError } = await supabase
      .from('import_containers')
      .update({ status: 'CONFIRMED' })
      .eq('id', codRequest.dropoff_order_id)

    if (containerError) {
      console.error('Error updating container status:', containerError)
    }

    // Ghi audit log
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()

    const container = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: requestId,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'DELIVERY_CONFIRMED',
        details: {
          container_number: container?.container_number,
          confirmed_at: new Date().toISOString()
        }
      })

    revalidatePath('/dispatcher')
    revalidatePath('/carrier-admin')
    revalidatePath('/billing')

    return {
      success: true,
      message: `Đã xác nhận giao hàng cho container ${container?.container_number}. ${codRequest.cod_fee > 0 ? 'Đang chờ thanh toán phí COD.' : 'Hoàn tất yêu cầu COD.'}`
    }

  } catch (error: any) {
    console.error('Error in confirmCodDelivery:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
}

// Stage 6: Admin confirms payment received - SERVER ACTION
export async function confirmCodPayment(requestId: string): Promise<CodRequestResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập.'
      }
    }

    const userWithProfile: UserWithProfile = { 
      id: user.id, 
      email: user.email, 
      profile: user.profile 
    }
    
    // Chỉ admin hoặc carrier admin mới có thể confirm payment
    if (!can(userWithProfile, Permission.APPROVE_ANY_REQUEST)) {
      return {
        success: false,
        message: 'Bạn không có quyền xác nhận thanh toán.'
      }
    }

    const supabase = await createClient()

    // Lấy thông tin yêu cầu COD
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select(`
        id, 
        status, 
        cod_fee,
        requesting_org_id,
        import_container:import_containers!dropoff_order_id(
          container_number
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !codRequest) {
      return {
        success: false,
        message: 'Không tìm thấy yêu cầu COD'
      }
    }

    // Kiểm tra trạng thái - chỉ cho phép confirm từ PENDING_PAYMENT
    if (codRequest.status !== 'PENDING_PAYMENT') {
      return {
        success: false,
        message: 'Chỉ có thể xác nhận thanh toán cho yêu cầu đang chờ thanh toán'
      }
    }

    // Nếu không có phí COD, chuyển thẳng tới COMPLETED
    const nextStatus = codRequest.cod_fee > 0 ? 'PAID' : 'COMPLETED'
    const updateData: any = {
      status: nextStatus,
      updated_at: new Date().toISOString()
    }

    if (codRequest.cod_fee > 0) {
      updateData.payment_confirmed_at = new Date().toISOString()
    }

    if (nextStatus === 'COMPLETED') {
      updateData.completed_at = new Date().toISOString()
    }

    // STAGE 6: Update status to PAID or COMPLETED
    const { error: updateError } = await supabase
      .from('cod_requests')
      .update(updateData)
      .eq('id', requestId)

    if (updateError) {
      console.error('Error confirming payment:', updateError)
      return {
        success: false,
        message: 'Không thể xác nhận thanh toán. Vui lòng thử lại.'
      }
    }

    // Cập nhật transaction status thành PAID nếu có phí
    if (codRequest.cod_fee > 0) {
      await supabase
        .from('transactions')
        .update({ 
          status: 'PAID',
          updated_at: new Date().toISOString()
        })
        .eq('related_request_id', requestId)
        .eq('status', 'UNPAID')
    }

    // Ghi audit log
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()

    const container = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: requestId,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: codRequest.cod_fee > 0 ? 'PAYMENT_CONFIRMED' : 'COMPLETED',
        details: {
          container_number: container?.container_number,
          payment_amount: codRequest.cod_fee,
          confirmed_at: new Date().toISOString()
        }
      })

    revalidatePath('/carrier-admin')
    revalidatePath('/billing')
    revalidatePath('/admin/billing')

    return {
      success: true,
      message: codRequest.cod_fee > 0 
        ? `Đã xác nhận thanh toán ${codRequest.cod_fee.toLocaleString('vi-VN')} VNĐ cho container ${container?.container_number}. Chờ xử lý tại depot.`
        : `Hoàn tất yêu cầu COD cho container ${container?.container_number}.`
    }

  } catch (error: any) {
    console.error('Error in confirmCodPayment:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
}

// Stage 7: Depot processing started - SERVER ACTION
export async function startDepotProcessing(requestId: string): Promise<CodRequestResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập.'
      }
    }

    const userWithProfile: UserWithProfile = { 
      id: user.id, 
      email: user.email, 
      profile: user.profile 
    }
    
    // Chỉ admin mới có thể start depot processing
    if (!can(userWithProfile, Permission.APPROVE_ANY_REQUEST)) {
      return {
        success: false,
        message: 'Bạn không có quyền bắt đầu xử lý depot.'
      }
    }

    const supabase = await createClient()

    // Lấy thông tin yêu cầu COD
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select(`
        id, 
        status,
        import_container:import_containers!dropoff_order_id(
          container_number
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !codRequest) {
      return {
        success: false,
        message: 'Không tìm thấy yêu cầu COD'
      }
    }

    // Kiểm tra trạng thái - cho phép từ PAID
    if (codRequest.status !== 'PAID') {
      return {
        success: false,
        message: 'Chỉ có thể bắt đầu xử lý depot sau khi thanh toán hoàn tất'
      }
    }

    // STAGE 7: Update status to PROCESSING_AT_DEPOT
    const { error: updateError } = await supabase
      .from('cod_requests')
      .update({
        status: 'PROCESSING_AT_DEPOT',
        depot_processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error starting depot processing:', updateError)
      return {
        success: false,
        message: 'Không thể bắt đầu xử lý depot. Vui lòng thử lại.'
      }
    }

    // Ghi audit log
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()

    const container = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: requestId,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'DEPOT_PROCESSING_STARTED',
        details: {
          container_number: container?.container_number,
          started_at: new Date().toISOString()
        }
      })

    revalidatePath('/carrier-admin')
    revalidatePath('/admin')

    return {
      success: true,
      message: `Đã bắt đầu xử lý depot cho container ${container?.container_number}.`
    }

  } catch (error: any) {
    console.error('Error in startDepotProcessing:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
}

// Stage 8: Complete COD process (e-Depot integration signal) - SERVER ACTION
export async function completeCodProcess(requestId: string): Promise<CodRequestResult> {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return {
        success: false,
        message: 'Người dùng chưa đăng nhập.'
      }
    }

    const userWithProfile: UserWithProfile = { 
      id: user.id, 
      email: user.email, 
      profile: user.profile 
    }
    
    // Chỉ admin mới có thể complete COD
    if (!can(userWithProfile, Permission.APPROVE_ANY_REQUEST)) {
      return {
        success: false,
        message: 'Bạn không có quyền hoàn tất quy trình COD.'
      }
    }

    const supabase = await createClient()

    // Lấy thông tin yêu cầu COD
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select(`
        id, 
        status,
        dropoff_order_id,
        import_container:import_containers!dropoff_order_id(
          container_number
        )
      `)
      .eq('id', requestId)
      .single()

    if (fetchError || !codRequest) {
      return {
        success: false,
        message: 'Không tìm thấy yêu cầu COD'
      }
    }

    // Kiểm tra trạng thái - cho phép từ PROCESSING_AT_DEPOT
    if (codRequest.status !== 'PROCESSING_AT_DEPOT') {
      return {
        success: false,
        message: 'Chỉ có thể hoàn tất COD đang được xử lý tại depot'
      }
    }

    // STAGE 8: Update status to COMPLETED
    const { error: updateError } = await supabase
      .from('cod_requests')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error completing COD process:', updateError)
      return {
        success: false,
        message: 'Không thể hoàn tất quy trình COD. Vui lòng thử lại.'
      }
    }

    // Update container status to AVAILABLE (ready for next use)
    const { error: containerError } = await supabase
      .from('import_containers')
      .update({ status: 'AVAILABLE' })
      .eq('id', codRequest.dropoff_order_id)

    if (containerError) {
      console.error('Error updating container status to AVAILABLE:', containerError)
    }

    // Ghi audit log
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()

    const container = Array.isArray(codRequest.import_container) ? codRequest.import_container[0] : codRequest.import_container
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: requestId,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'COMPLETED',
        details: {
          container_number: container?.container_number,
          completed_at: new Date().toISOString()
        }
      })

    revalidatePath('/carrier-admin')
    revalidatePath('/dispatcher')
    revalidatePath('/admin')

    return {
      success: true,
      message: `Đã hoàn tất quy trình COD cho container ${container?.container_number}. Container đã sẵn sàng để sử dụng.`
    }

  } catch (error: any) {
    console.error('Error in completeCodProcess:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
} 