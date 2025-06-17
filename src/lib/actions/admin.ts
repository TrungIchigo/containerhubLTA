'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Types
interface AdminActionResult {
  success: boolean
  message: string
  error?: string
}

// Helper function to verify admin permissions
async function verifyAdminPermissions() {
  const supabase = await createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('Unauthorized: User not authenticated')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'PLATFORM_ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }

  return { user, profile }
}

// Get admin dashboard statistics
export async function getAdminDashboardStats() {
  try {
    await verifyAdminPermissions()
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats')
    
    if (error) {
      console.error('Error fetching admin stats:', error)
      return {
        pending_count: 0,
        active_count: 0,
        rejected_count: 0,
        total_count: 0,
        today_registrations: 0
      }
    }

    return data[0] || {
      pending_count: 0,
      active_count: 0,
      rejected_count: 0,
      total_count: 0,
      today_registrations: 0
    }
  } catch (error) {
    console.error('Admin stats error:', error)
    return {
      pending_count: 0,
      active_count: 0,
      rejected_count: 0,
      total_count: 0,
      today_registrations: 0
    }
  }
}

// Get pending organizations for admin review
export async function getPendingOrganizations() {
  try {
    await verifyAdminPermissions()
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('get_pending_organizations')
    
    if (error) {
      console.error('Error fetching pending organizations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Pending organizations error:', error)
    return []
  }
}

// Get organization details for admin review
export async function getOrganizationForAdminReview(orgId: string) {
  try {
    await verifyAdminPermissions()
    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('get_organization_for_admin_review', {
      org_id: orgId
    })
    
    if (error) {
      console.error('Error fetching organization details:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Organization details error:', error)
    return null
  }
}

// Approve organization
export async function approveOrganization(orgId: string): Promise<AdminActionResult> {
  try {
    console.log('🟢 Starting organization approval for:', orgId)
    
    const { user } = await verifyAdminPermissions()
    const supabase = await createClient()
    
    // Get organization details for email notification
    const { data: orgData, error: fetchError } = await supabase
      .from('organizations')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .eq('id', orgId)
      .single()

    if (fetchError || !orgData) {
      throw new Error('Organization not found')
    }

    // Update organization status to ACTIVE
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        status: 'ACTIVE',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', orgId)

    if (updateError) {
      throw new Error('Failed to approve organization: ' + updateError.message)
    }

    // Send approval email
    try {
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: {
          to: orgData.profiles.email,
          fullName: orgData.profiles.full_name,
          companyName: orgData.name,
          status: 'approved'
        }
      })

      if (emailError) {
        console.log('⚠️ Email sending failed, but approval was successful')
      } else {
        console.log('✅ Approval email sent successfully')
      }
    } catch (emailSendError) {
      console.log('⚠️ Email sending error:', emailSendError)
      // Continue with success even if email fails
    }

    console.log('✅ Organization approved successfully:', orgId)
    
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/organizations')
    
    return {
      success: true,
      message: `Tổ chức "${orgData.name}" đã được phê duyệt thành công!`
    }

  } catch (error) {
    console.error('❌ Organization approval error:', error)
    return {
      success: false,
      message: 'Có lỗi xảy ra khi phê duyệt tổ chức',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Reject organization
export async function rejectOrganization(
  orgId: string, 
  reason: string
): Promise<AdminActionResult> {
  try {
    console.log('🔴 Starting organization rejection for:', orgId)
    
    if (!reason?.trim()) {
      return {
        success: false,
        message: 'Lý do từ chối là bắt buộc'
      }
    }

    const { user } = await verifyAdminPermissions()
    const supabase = await createClient()
    
    // Get organization details for email notification
    const { data: orgData, error: fetchError } = await supabase
      .from('organizations')
      .select(`
        *,
        profiles!inner(full_name, email)
      `)
      .eq('id', orgId)
      .single()

    if (fetchError || !orgData) {
      throw new Error('Organization not found')
    }

    // Update organization status to REJECTED
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        status: 'REJECTED',
        admin_rejection_reason: reason.trim(),
        rejected_by: user.id,
        rejected_at: new Date().toISOString()
      })
      .eq('id', orgId)

    if (updateError) {
      throw new Error('Failed to reject organization: ' + updateError.message)
    }

    // Send rejection email
    try {
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: {
          to: orgData.profiles.email,
          fullName: orgData.profiles.full_name,
          companyName: orgData.name,
          status: 'rejected',
          rejectionReason: reason.trim()
        }
      })

      if (emailError) {
        console.log('⚠️ Email sending failed, but rejection was successful')
      } else {
        console.log('✅ Rejection email sent successfully')
      }
    } catch (emailSendError) {
      console.log('⚠️ Email sending error:', emailSendError)
      // Continue with success even if email fails
    }

    console.log('✅ Organization rejected successfully:', orgId)
    
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/organizations')
    
    return {
      success: true,
      message: `Tổ chức "${orgData.name}" đã bị từ chối`
    }

  } catch (error) {
    console.error('❌ Organization rejection error:', error)
    return {
      success: false,
      message: 'Có lỗi xảy ra khi từ chối tổ chức',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get all organizations with filtering
export async function getAllOrganizations(status?: 'PENDING_ADMIN_APPROVAL' | 'ACTIVE' | 'REJECTED') {
  try {
    await verifyAdminPermissions()
    const supabase = await createClient()
    
    let query = supabase
      .from('organizations')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query

    if (error) {
      console.error('Error fetching organizations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Organizations fetch error:', error)
    return []
  }
}

// Check if current user is platform admin
export async function isPlatformAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return false
    }

    const { data, error } = await supabase.rpc('is_platform_admin')
    
    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
} 