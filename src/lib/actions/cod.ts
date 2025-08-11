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
  depot_id: string
  reason_for_request: string
  container_number: string
  cod_fee: number // Phí COD đã được tính toán ở client
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
    if (!data.dropoff_order_id || !data.depot_id) {
      console.error('Invalid input data:', {
        hasDropoffOrderId: !!data.dropoff_order_id,
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

    if (containerError) {
      console.error('Container lookup failed:', { containerError, hasContainer: !!container })
      return {
        success: false,
        message: 'Không tìm thấy container liên quan'
      }
    }

    // Kiểm tra xem đã có COD request nào đang pending cho container này chưa
    const { data: existingRequest, error: requestCheckError } = await supabase
      .from('cod_requests')
      .select('id, status')
      .eq('dropoff_order_id', data.dropoff_order_id)
      .in('status', ['PENDING', 'APPROVED', 'MORE_INFO_REQUESTED'])
      .maybeSingle()

    if (requestCheckError) {
      console.error('Error checking existing COD requests:', requestCheckError)
    }

    if (existingRequest) {
      return {
        success: false,
        message: 'Container này đã có yêu cầu COD đang được xử lý. Không thể tạo yêu cầu mới.'
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

    // BƯỚC 2: Lấy thông tin depot mới từ bảng gpg_depots và kiểm tra trong bảng depots
    const [{ data: newDepot, error: depotError }, { data: depotInDepotsTable }] = await Promise.all([
      supabase
        .from('gpg_depots')
        .select('id, name, address, city_id')
        .eq('id', data.depot_id)
        .single(),
      supabase
        .from('depots')
        .select('id')
        .eq('id', data.depot_id)
        .maybeSingle()
    ])

    if (depotError) {
      console.error('GPG Depot lookup failed:', { 
        error: depotError,
        depotId: data.depot_id,
        errorMessage: depotError.message,
        errorDetails: depotError.details
      })
      return {
        success: false,
        message: 'Không tìm thấy depot trong hệ thống GPG'
      }
    }

    if (!newDepot) {
      console.error('GPG Depot not found:', { depotId: data.depot_id })
      return {
        success: false,
        message: 'Depot không tồn tại trong hệ thống GPG'
      }
    }

    // Kiểm tra xem depot có trong bảng depots không
    if (!depotInDepotsTable) {
      console.error('Depot not found in depots table:', { depotId: data.depot_id })
      return {
        success: false,
        message: 'Depot chưa được đồng bộ vào hệ thống. Vui lòng liên hệ admin.'
      }
    }
    
    console.log('Found new GPG depot:', newDepot)

    // Kiểm tra không trùng với depot hiện tại
    if (container.depot_id === data.depot_id) {
      return {
        success: false,
        message: 'Depot mới không thể trùng với depot hiện tại'
      }
    }

    // Kiểm tra đã được thực hiện ở trên (dòng 84-98)

    // BƯỚC 3: Xác thực phí COD đã được tính toán ở client
    console.log('=== COD FEE VALIDATION START ===')
    console.log('Container depot_id:', container.depot_id)
    console.log('Requested depot_id:', data.depot_id)
    console.log('Client-calculated COD fee:', data.cod_fee, 'VNĐ')
    
    // Tin tưởng vào phí đã được tính toán ở client, chỉ xác thực cơ bản
    const calculatedCodFee = data.cod_fee
    
    // Xác thực cơ bản: phí phải >= 0
    if (calculatedCodFee < 0) {
      console.error('❌ Invalid COD fee:', calculatedCodFee)
      return {
        success: false,
        message: 'Phí COD không hợp lệ. Vui lòng thử lại.'
      }
    }
    
    console.log('✅ COD fee validated:', calculatedCodFee, 'VNĐ')
    console.log('=== COD FEE VALIDATION END ===')

    // BƯỚC 4: Tạo yêu cầu COD với phí đã tính
    const codRequestData = {
      dropoff_order_id: data.dropoff_order_id,
      requesting_org_id: requestingOrgId,
      approving_org_id: container.shipping_line_org_id,
      original_depot_address: container.drop_off_location,
      requested_depot_id: data.depot_id,
      reason_for_request: data.reason_for_request,
      cod_fee: calculatedCodFee,
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
        requested_depot:gpg_depots!requested_depot_id(
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
    
    // Both Platform Admin and Carrier Admin can view all requests
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
        requested_depot:gpg_depots!cod_requests_requested_depot_id_fkey(
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

    // CARRIER_ADMIN now has global access - no filtering by organization

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
        requested_depot:gpg_depots!requested_depot_id(
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

    // Kiểm tra quyền xử lý - CARRIER_ADMIN có quyền xử lý tất cả COD requests
    if (user.profile.role !== 'CARRIER_ADMIN' && codRequest.approving_org_id !== user.profile.organization_id) {
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
        .update({ status: 'COD_REJECTED' })
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
          // Update status to AWAITING_COD_PAYMENT after COD approval (chờ thanh toán phí COD)
          status: 'AWAITING_COD_PAYMENT'
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
    
    // Chỉ admin hoặc carrier admin mới có thể request more info
    if (!can(userWithProfile, Permission.APPROVE_ANY_REQUEST)) {
      return {
        success: false,
        message: 'Bạn không có quyền yêu cầu bổ sung thông tin.'
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

    // Kiểm tra quyền - CARRIER_ADMIN có quyền xử lý tất cả COD requests
    if (user.profile.role !== 'CARRIER_ADMIN' && codRequest.approving_org_id !== user.profile.organization_id) {
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

// Thay thế toàn bộ các hàm xác nhận trạng thái COD chỉ thao tác với import_containers

/**
 * Xác nhận hoàn tất COD cho container (không dùng cod_requests)
 */
export async function confirmCodCompletion(containerId: string): Promise<CodRequestResult> {
  try {
    console.log('[DEBUG] confirmCodCompletion - input containerId:', containerId)
    const user = await getCurrentUser()
    if (!user?.id || user.profile.role !== 'DISPATCHER') {
      console.error('[DEBUG] confirmCodCompletion - user not dispatcher or not logged in', user)
      return { success: false, message: 'Chỉ Dispatcher mới có thể xác nhận hoàn tất COD.' }
    }
    const supabase = await createClient()
    const { data: container, error } = await supabase
      .from('import_containers')
      .select('id, status, container_number')
      .eq('id', containerId)
      .single()
    console.log('[DEBUG] confirmCodCompletion - container query result:', { container, error })
    if (error || !container) {
      console.error('[DEBUG] confirmCodCompletion - Không tìm thấy container', error)
      return { success: false, message: 'Không tìm thấy container' }
    }
    if (container.status !== 'ON_GOING_COD') {
      console.error('[DEBUG] confirmCodCompletion - Trạng thái không hợp lệ:', container.status)
      return { success: false, message: 'Chỉ xác nhận hoàn tất khi container đang thực hiện COD' }
    }
    // Cập nhật trạng thái container thành DEPOT_PROCESSING (đang xử lý tại depot)
    const { error: updateError } = await supabase
      .from('import_containers')
      .update({ status: 'DEPOT_PROCESSING' })
      .eq('id', containerId)
    console.log('[DEBUG] confirmCodCompletion - update status result:', updateError)
    if (updateError) {
      console.error('[DEBUG] confirmCodCompletion - Không thể cập nhật trạng thái container', updateError)
      return { success: false, message: 'Không thể cập nhật trạng thái container' }
    }
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: null,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'COD_COMPLETED',
        details: { container_number: container.container_number, confirmed_at: new Date().toISOString() }
      })
    revalidatePath('/dispatcher')
    revalidatePath('/dispatcher/requests')
    console.log('[DEBUG] confirmCodCompletion - SUCCESS')
    return { success: true, message: `Đã xác nhận hoàn tất COD cho container ${container.container_number}. Container đang được xử lý tại depot.` }
  } catch (error: any) {
    console.error('[DEBUG] confirmCodCompletion - Exception:', error)
    return { success: false, message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.' }
  }
}

/**
 * Xác nhận giao hàng COD (không dùng cod_requests)
 */
export async function confirmCodDelivery(containerId: string): Promise<CodRequestResult> {
  try {
    console.log('[DEBUG] confirmCodDelivery - input containerId:', containerId)
    const user = await getCurrentUser()
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
      console.error('[DEBUG] confirmCodDelivery - user not dispatcher or not logged in', user)
      return { success: false, message: 'Chỉ Dispatcher mới có thể xác nhận giao hàng.' }
    }
    const supabase = await createClient()
    const { data: container, error } = await supabase
      .from('import_containers')
      .select('id, status, container_number')
      .eq('id', containerId)
      .single()
    console.log('[DEBUG] confirmCodDelivery - container query result:', { container, error })
    if (error || !container) {
      console.error('[DEBUG] confirmCodDelivery - Không tìm thấy container', error)
      return { success: false, message: 'Không tìm thấy container' }
    }
    if (container.status !== 'ON_GOING_COD') {
      console.error('[DEBUG] confirmCodDelivery - Trạng thái không hợp lệ:', container.status)
      return { success: false, message: 'Chỉ có thể xác nhận hoàn tất COD cho container đang thực hiện COD' }
    }
    const { error: updateError } = await supabase
      .from('import_containers')
      .update({ status: 'DEPOT_PROCESSING', delivery_confirmed_at: new Date().toISOString() })
      .eq('id', containerId)
    console.log('[DEBUG] confirmCodDelivery - update status result:', updateError)
    if (updateError) {
      console.error('[DEBUG] confirmCodDelivery - Không thể xác nhận giao hàng', updateError)
      return { success: false, message: 'Không thể xác nhận giao hàng. Vui lòng thử lại.' }
    }
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: null,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'DELIVERY_CONFIRMED',
        details: { container_number: container.container_number, confirmed_at: new Date().toISOString() }
      })
    revalidatePath('/dispatcher')
    revalidatePath('/carrier-admin')
    revalidatePath('/billing')
    console.log('[DEBUG] confirmCodDelivery - SUCCESS')
    return { success: true, message: `Đã xác nhận hoàn tất COD cho container ${container.container_number}. Container đang được xử lý tại depot.` }
  } catch (error: any) {
    console.error('[DEBUG] confirmCodDelivery - Exception:', error)
    return { success: false, message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.' }
  }
}

/**
 * Xác nhận thanh toán COD bằng requestId
 */
export async function confirmCodPaymentByRequestId(requestId: string): Promise<CodRequestResult> {
  try {
    console.log('[DEBUG] confirmCodPaymentByRequestId - input requestId:', requestId)
    const user = await getCurrentUser()
    if (!user?.id) {
      console.error('[DEBUG] confirmCodPaymentByRequestId - user not logged in', user)
      return { success: false, message: 'Người dùng chưa đăng nhập.' }
    }
    
    const supabase = await createClient()
    
    // Lấy thông tin COD request để có containerId
    const { data: codRequest, error: codError } = await supabase
      .from('cod_requests')
      .select('id, dropoff_order_id, status')
      .eq('id', requestId)
      .single()
    
    console.log('[DEBUG] confirmCodPaymentByRequestId - cod request query result:', { codRequest, codError })
    if (codError || !codRequest) {
      console.error('[DEBUG] confirmCodPaymentByRequestId - Không tìm thấy COD request', codError)
      return { success: false, message: 'Không tìm thấy yêu cầu COD' }
    }
    
    // Gọi function confirmCodPayment với containerId
    return await confirmCodPayment(codRequest.dropoff_order_id)
  } catch (error: any) {
    console.error('Error in confirmCodPaymentByRequestId:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
    }
  }
}

/**
 * Xác nhận thanh toán COD (không dùng cod_requests)
 */
export async function confirmCodPayment(containerId: string): Promise<CodRequestResult> {
  try {
    console.log('[DEBUG] confirmCodPayment - input containerId:', containerId)
    const user = await getCurrentUser()
    if (!user?.id) {
      console.error('[DEBUG] confirmCodPayment - user not logged in', user)
      return { success: false, message: 'Người dùng chưa đăng nhập.' }
    }
    const supabase = await createClient()
    const { data: container, error } = await supabase
      .from('import_containers')
      .select('id, status, container_number')
      .eq('id', containerId)
      .single()
    console.log('[DEBUG] confirmCodPayment - container query result:', { container, error })
    if (error || !container) {
      console.error('[DEBUG] confirmCodPayment - Không tìm thấy container', error)
      return { success: false, message: 'Không tìm thấy container' }
    }
    if (container.status !== 'AWAITING_COD_PAYMENT') {
      console.error('[DEBUG] confirmCodPayment - Trạng thái không hợp lệ:', container.status)
      return { success: false, message: 'Chỉ có thể xác nhận thanh toán cho lệnh đang chờ thanh toán phí COD' }
    }
    const { error: updateError } = await supabase
      .from('import_containers')
      .update({ status: 'ON_GOING_COD', payment_confirmed_at: new Date().toISOString() })
      .eq('id', containerId)
    console.log('[DEBUG] confirmCodPayment - update status result:', updateError)
    if (updateError) {
      console.error('[DEBUG] confirmCodPayment - Không thể xác nhận thanh toán', updateError)
      return { success: false, message: 'Không thể xác nhận thanh toán. Vui lòng thử lại.' }
    }
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: null,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'PAYMENT_CONFIRMED',
        details: { container_number: container.container_number, confirmed_at: new Date().toISOString() }
      })
    revalidatePath('/carrier-admin')
    revalidatePath('/billing')
    revalidatePath('/admin/billing')
    console.log('[DEBUG] confirmCodPayment - SUCCESS')
    return { success: true, message: `Đã xác nhận thanh toán cho container ${container.container_number}. Chờ xử lý tại depot.` }
  } catch (error: any) {
    console.error('[DEBUG] confirmCodPayment - Exception:', error)
    return { success: false, message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.' }
  }
}

/**
 * Bắt đầu xử lý depot (không dùng cod_requests)
 */
export async function startDepotProcessing(containerId: string): Promise<CodRequestResult> {
  try {
    console.log('[DEBUG] startDepotProcessing - input containerId:', containerId)
    const user = await getCurrentUser()
    if (!user?.id) {
      console.error('[DEBUG] startDepotProcessing - user not logged in', user)
      return { success: false, message: 'Người dùng chưa đăng nhập.' }
    }
    const supabase = await createClient()
    const { data: container, error } = await supabase
      .from('import_containers')
      .select('id, status, container_number')
      .eq('id', containerId)
      .single()
    console.log('[DEBUG] startDepotProcessing - container query result:', { container, error })
    if (error || !container) {
      console.error('[DEBUG] startDepotProcessing - Không tìm thấy container', error)
      return { success: false, message: 'Không tìm thấy container' }
    }
    if (container.status !== 'ON_GOING_COD') {
      console.error('[DEBUG] startDepotProcessing - Trạng thái không hợp lệ:', container.status)
      return { success: false, message: 'Chỉ có thể bắt đầu xử lý depot sau khi thanh toán hoàn tất' }
    }
    const { error: updateError } = await supabase
      .from('import_containers')
      .update({ status: 'DEPOT_PROCESSING', depot_processing_started_at: new Date().toISOString() })
      .eq('id', containerId)
    console.log('[DEBUG] startDepotProcessing - update status result:', updateError)
    if (updateError) {
      console.error('[DEBUG] startDepotProcessing - Không thể bắt đầu xử lý depot', updateError)
      return { success: false, message: 'Không thể bắt đầu xử lý depot. Vui lòng thử lại.' }
    }
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: null,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'DEPOT_PROCESSING_STARTED',
        details: { container_number: container.container_number, started_at: new Date().toISOString() }
      })
    revalidatePath('/carrier-admin')
    revalidatePath('/admin')
    console.log('[DEBUG] startDepotProcessing - SUCCESS')
    return { success: true, message: `Đã bắt đầu xử lý depot cho container ${container.container_number}.` }
  } catch (error: any) {
    console.error('[DEBUG] startDepotProcessing - Exception:', error)
    return { success: false, message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.' }
  }
}

/**
 * Hoàn tất quy trình COD (không dùng cod_requests) - DEPRECATED
 * @deprecated Sử dụng completeDepotProcessing thay thế
 */
export async function completeCodProcess(containerId: string): Promise<CodRequestResult> {
  try {
    console.log('[DEBUG] completeCodProcess - input containerId:', containerId)
    const user = await getCurrentUser()
    if (!user?.id) {
      console.error('[DEBUG] completeCodProcess - user not logged in', user)
      return { success: false, message: 'Người dùng chưa đăng nhập.' }
    }
    const supabase = await createClient()
    const { data: container, error } = await supabase
      .from('import_containers')
      .select('id, status, container_number')
      .eq('id', containerId)
      .single()
    console.log('[DEBUG] completeCodProcess - container query result:', { container, error })
    if (error || !container) {
      console.error('[DEBUG] completeCodProcess - Không tìm thấy container', error)
      return { success: false, message: 'Không tìm thấy container' }
    }
    if (container.status !== 'DEPOT_PROCESSING') {
      console.error('[DEBUG] completeCodProcess - Trạng thái không hợp lệ:', container.status)
      return { success: false, message: 'Chỉ có thể hoàn tất COD đang được xử lý tại depot' }
    }
    const { error: updateError } = await supabase
      .from('import_containers')
      .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
      .eq('id', containerId)
    console.log('[DEBUG] completeCodProcess - update status result:', updateError)
    if (updateError) {
      console.error('[DEBUG] completeCodProcess - Không thể hoàn tất quy trình COD', updateError)
      return { success: false, message: 'Không thể hoàn tất quy trình COD. Vui lòng thử lại.' }
    }
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: null,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'COMPLETED',
        details: { container_number: container.container_number, completed_at: new Date().toISOString() }
      })
    revalidatePath('/carrier-admin')
    revalidatePath('/dispatcher')
    revalidatePath('/admin')
    console.log('[DEBUG] completeCodProcess - SUCCESS')
    return { success: true, message: `Đã hoàn tất quy trình COD cho container ${container.container_number}. Container đã sẵn sàng để sử dụng.` }
  } catch (error: any) {
    console.error('[DEBUG] completeCodProcess - Exception:', error)
    return { success: false, message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.' }
  }
}

/**
 * Hoàn tất xử lý tại depot - chuyển container từ DEPOT_PROCESSING sang COMPLETED
 */
export async function completeDepotProcessing(containerId: string): Promise<CodRequestResult> {
  try {
    console.log('[DEBUG] completeDepotProcessing - input containerId:', containerId)
    const user = await getCurrentUser()
    if (!user?.id || user.profile.role !== 'DISPATCHER') {
      console.error('[DEBUG] completeDepotProcessing - user not dispatcher or not logged in', user)
      return { success: false, message: 'Chỉ Dispatcher mới có thể xác nhận hoàn tất xử lý tại depot.' }
    }
    const supabase = await createClient()
    const { data: container, error } = await supabase
      .from('import_containers')
      .select('id, status, container_number')
      .eq('id', containerId)
      .single()
    console.log('[DEBUG] completeDepotProcessing - container query result:', { container, error })
    if (error || !container) {
      console.error('[DEBUG] completeDepotProcessing - Không tìm thấy container', error)
      return { success: false, message: 'Không tìm thấy container' }
    }
    if (container.status !== 'DEPOT_PROCESSING') {
      console.error('[DEBUG] completeDepotProcessing - Trạng thái không hợp lệ:', container.status)
      return { success: false, message: 'Chỉ có thể hoàn tất container đang được xử lý tại depot' }
    }
    // Cập nhật trạng thái container thành COMPLETED (hoàn tất vòng đời)
    const { error: updateError } = await supabase
      .from('import_containers')
      .update({ 
        status: 'COMPLETED', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', containerId)
    console.log('[DEBUG] completeDepotProcessing - update status result:', updateError)
    if (updateError) {
      console.error('[DEBUG] completeDepotProcessing - Không thể hoàn tất xử lý tại depot', updateError)
      return { success: false, message: 'Không thể hoàn tất xử lý tại depot. Vui lòng thử lại.' }
    }
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', user.profile.organization_id)
      .single()
    await supabase
      .from('cod_audit_logs')
      .insert({
        request_id: null,
        actor_user_id: user.id,
        actor_org_name: orgData?.name || 'Unknown Organization',
        action: 'DEPOT_PROCESSING_COMPLETED',
        details: { container_number: container.container_number, completed_at: new Date().toISOString() }
      })
    revalidatePath('/dispatcher')
    revalidatePath('/carrier-admin')
    revalidatePath('/admin')
    console.log('[DEBUG] completeDepotProcessing - SUCCESS')
    return { success: true, message: `Đã hoàn tất xử lý tại depot cho container ${container.container_number}. Container đã hoàn tất vòng đời.` }
  } catch (error: any) {
    console.error('[DEBUG] completeDepotProcessing - Exception:', error)
    return { success: false, message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.' }
  }
}