'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

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
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'DISPATCHER') {
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
      return {
        success: false,
        message: 'Không tìm thấy container liên quan'
      }
    }

    // Kiểm tra container thuộc về công ty hiện tại
    if (container.trucking_company_org_id !== requestingOrgId) {
      return {
        success: false,
        message: 'Container này không thuộc về công ty của bạn'
      }
    }

    // Kiểm tra trạng thái container
    if (container.status !== 'AVAILABLE') {
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
      return {
        success: false,
        message: 'Depot mới không hợp lệ'
      }
    }

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

    // BƯỚC 3: Tạo yêu cầu COD
    const { data: codRequest, error: codError } = await supabase
      .from('cod_requests')
      .insert({
        dropoff_order_id: data.dropoff_order_id,
        requesting_org_id: requestingOrgId,
        approving_org_id: container.shipping_line_org_id,
        original_depot_address: container.drop_off_location,
        requested_depot_id: data.depot_id,
        reason_for_request: data.reason_for_request,
        status: 'PENDING'
      })
      .select()
      .single()

    if (codError) {
      console.error('Error creating COD request:', codError)
      return {
        success: false,
        message: 'Không thể tạo yêu cầu COD. Vui lòng thử lại.'
      }
    }

    // BƯỚC 4: Cập nhật trạng thái container thành AWAITING_COD_APPROVAL
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

    // BƯỚC 5: Ghi audit log
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
          reason: data.reason_for_request
        }
      })

    // BƯỚC 6: Revalidate các trang liên quan
    revalidatePath('/dispatcher')
    revalidatePath('/dispatcher/requests')
    revalidatePath('/carrier-admin')

    return {
      success: true,
      message: `Đã gửi yêu cầu thay đổi nơi trả container ${container.container_number} thành công!`,
      data: {
        requestId: codRequest.id,
        containerNumber: container.container_number,
        newDepotName: newDepot.name
      }
    }

  } catch (error: any) {
    console.error('Error in createCodRequest:', error)
    return {
      success: false,
      message: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.'
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

// Get COD requests for carrier admin
export async function getCarrierCodRequests() {
  try {
    const user = await getCurrentUser()
    
    if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
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
        requesting_org:organizations!requesting_org_id(
          name
        )
      `)
      .eq('approving_org_id', user.profile.organization_id)
      .order('created_at', { ascending: false })

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
    
    if (!user?.profile?.organization_id || user.profile.role !== 'CARRIER_ADMIN') {
      return {
        success: false,
        message: 'Unauthorized: Chỉ Carrier Admin mới có thể xử lý yêu cầu COD'
      }
    }

    const supabase = await createClient()

    // BƯỚC 1: Lấy thông tin yêu cầu COD và kiểm tra trạng thái
    const { data: codRequest, error: fetchError } = await supabase
      .from('cod_requests')
      .select(`
        id,
        status,
        dropoff_order_id,
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
          updated_at: new Date().toISOString()
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
      await supabase
        .from('import_containers')
        .update({ status: 'AVAILABLE' })
        .eq('id', codRequest.dropoff_order_id)

    } else if (decision === 'APPROVED') {
      // Phê duyệt yêu cầu
      const { error: updateError } = await supabase
        .from('cod_requests')
        .update({
          status: 'APPROVED',
          cod_fee: codFee || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (updateError) {
        console.error('Error approving COD request:', updateError)
        return {
          success: false,
          message: 'Không thể phê duyệt yêu cầu. Vui lòng thử lại.'
        }
      }

      // Cập nhật thông tin container với depot mới
      const depot = Array.isArray(codRequest.requested_depot) ? codRequest.requested_depot[0] : codRequest.requested_depot
      const { error: containerUpdateError } = await supabase
        .from('import_containers')
        .update({
          depot_id: codRequest.requested_depot_id,
          drop_off_location: `${depot.name}, ${depot.address}`,
          latitude: depot.latitude,
          longitude: depot.longitude,
          status: 'AVAILABLE' // Mở khóa container
        })
        .eq('id', codRequest.dropoff_order_id)

      if (containerUpdateError) {
        console.error('Error updating container location:', containerUpdateError)
        return {
          success: false,
          message: 'Không thể cập nhật địa điểm container. Vui lòng thử lại.'
        }
      }
    }

    // BƯỚC 3: Ghi audit log
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
        action: decision,
        details: {
          container_number: container?.container_number,
          decision,
          cod_fee: codFee,
          reason_for_decision: reasonForDecision
        }
      })

    // BƯỚC 4: Revalidate các trang liên quan
    revalidatePath('/carrier-admin')
    revalidatePath('/dispatcher')
    revalidatePath('/dispatcher/requests')
    const successMessage = decision === 'APPROVED' 
      ? `Đã phê duyệt yêu cầu COD cho container ${container?.container_number}${codFee ? ` với phí ${codFee.toLocaleString('vi-VN')} VNĐ` : ''}`
      : `Đã từ chối yêu cầu COD cho container ${container?.container_number}`

    return {
      success: true,
      message: successMessage
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