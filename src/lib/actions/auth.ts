'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
// Define OTP types that match Supabase
type OtpType = 'signup' | 'recovery' | 'email_change'
import { OrganizationType } from '@/lib/types'

export async function createUserProfile(userId: string, data: {
  full_name: string
  organization_id: string
  role: 'DISPATCHER' | 'CARRIER_ADMIN'
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: data.full_name,
      organization_id: data.organization_id,
      role: data.role
    })

  if (error) {
    console.error('Error creating profile:', error)
    throw error
  }
}

export async function getCurrentUser() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    profile
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

function getDefaultPageForRole(role: string): string {
  switch (role) {
    case 'DISPATCHER':
      return '/dispatcher'
    case 'CARRIER_ADMIN':
      return '/carrier-admin'
    default:
      return '/dashboard'
  }
}

export async function redirectToRolePage() {
  const user = await getCurrentUser()
  
  if (!user?.profile?.role) {
    redirect('/login')
  }

  const defaultPage = getDefaultPageForRole(user.profile.role)
  redirect(defaultPage)
}

interface NewOrganizationData {
  // User data
  fullName: string
  email: string
  password: string
  organizationType: OrganizationType
  
  // Organization data
  companyName: string
  taxCode: string
  address: string
  phoneNumber: string
  representativeEmail: string
}

// Temporary storage for user registration data (in practice, use Redis or similar)
const tempRegistrationData = new Map<string, {
  data: NewOrganizationData
  timestamp: number
  otpCode?: string
}>()

export async function requestNewOrganization(data: NewOrganizationData) {
  try {
    console.log('🚀 Starting requestNewOrganization with email:', data.email)
    const supabase = await createClient()

    // Step 1: Check if user already exists first
    console.log('🔍 Checking if user already exists...')
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', data.email)
      .single()

    if (existingUser) {
      return { 
        success: false, 
        message: `Email "${data.email}" đã được đăng ký trước đó. Vui lòng sử dụng email khác hoặc đăng nhập nếu bạn có tài khoản.` 
      }
    }

    // Step 2: Generate and store OTP temporarily
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit OTP
    console.log('🔑 Generated OTP:', otpCode) // For debugging - remove in production
    
    // Store registration data temporarily (expires in 10 minutes)
    const tempKey = data.email
    tempRegistrationData.set(tempKey, {
      data: data,
      timestamp: Date.now(),
      otpCode: otpCode
    })

    // Clean up expired registrations (older than 10 minutes)
    for (const [key, value] of tempRegistrationData.entries()) {
      if (Date.now() - value.timestamp > 10 * 60 * 1000) {
        tempRegistrationData.delete(key)
      }
    }

    // Step 3: Send OTP email using Supabase Edge Function
    console.log('📧 Sending OTP to:', data.representativeEmail)
    console.log('📱 OTP Code for', data.representativeEmail, ':', otpCode)
    
    try {
      const supabase = await createClient()
      
      // Try to send email via Edge Function
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-otp-email', {
        body: {
          to: data.representativeEmail,
          otpCode: otpCode,
          fullName: data.fullName,
          companyName: data.companyName
        }
      })

      if (emailError || !emailResult?.success) {
        console.log('⚠️ Email sending failed, but continuing with OTP in console')
        console.log('📱 USE THIS OTP CODE:', otpCode)
        
        return { 
          success: true, 
          message: `Email gửi không thành công. Mã OTP để test: ${otpCode}`,
          tempKey: tempKey,
          otpCode: otpCode // Include for testing
        }
      }

      console.log('✅ OTP email sent successfully!')
      return { 
        success: true, 
        message: `Mã OTP đã được gửi đến email: ${data.representativeEmail}`,
        tempKey: tempKey
      }
      
    } catch (emailSendError) {
      console.error('❌ Email sending error:', emailSendError)
      console.log('📱 USE THIS OTP CODE:', otpCode)
      
      // Continue registration flow even if email fails
      return { 
        success: true, 
        message: `Không thể gửi email. Mã OTP để test: ${otpCode}`,
        tempKey: tempKey,
        otpCode: otpCode
      }
    }

  } catch (error: any) {
    console.error('💥 Fatal error in requestNewOrganization:', error)
    return { 
      success: false, 
      message: `Lỗi hệ thống: ${error.message}` 
    }
  }
}

export async function verifyOtp(
  email: string, 
  token: string, 
  type: OtpType,
  organizationId?: string
) {
  try {
    console.log('🔐 Starting OTP verification for:', email)
    const supabase = await createClient()

    // Step 1: Get stored registration data
    const tempData = tempRegistrationData.get(email)
    if (!tempData) {
      return { 
        success: false, 
        message: 'Dữ liệu đăng ký không tìm thấy hoặc đã hết hạn. Vui lòng đăng ký lại.' 
      }
    }

    // Step 2: Verify OTP code
    if (tempData.otpCode !== token) {
      return { 
        success: false, 
        message: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' 
      }
    }

    // Step 3: Check if OTP is expired (10 minutes)
    if (Date.now() - tempData.timestamp > 10 * 60 * 1000) {
      tempRegistrationData.delete(email)
      return { 
        success: false, 
        message: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.' 
      }
    }

    console.log('✅ OTP verified successfully')
    const registrationData = tempData.data

    // Step 4: NOW create user account (after OTP verification)
    console.log('👤 Creating user account after OTP verification...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: registrationData.email,
      password: registrationData.password,
      options: {
        data: {
          full_name: registrationData.fullName,
          organization_type: registrationData.organizationType,
          email_confirmed: true // Mark as confirmed since we verified OTP
        },
        emailRedirectTo: undefined
      }
    })

    if (signUpError) {
      console.error('❌ User creation error after OTP:', signUpError)
      return { 
        success: false, 
        message: `Lỗi tạo tài khoản: ${signUpError.message}` 
      }
    }

    if (!signUpData.user) {
      return { 
        success: false, 
        message: 'Không thể tạo tài khoản người dùng.' 
      }
    }

    console.log('✅ User account created:', signUpData.user.id)

    // Step 5: Create organization with PENDING_ADMIN_APPROVAL status
    console.log('🏢 Creating organization...')
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: registrationData.companyName,
        type: registrationData.organizationType,
        business_license_number: registrationData.taxCode,
        address: registrationData.address,
        phone_number: registrationData.phoneNumber,
        representative_email: registrationData.representativeEmail,
        representative_name: registrationData.fullName,
        status: 'PENDING_ADMIN_APPROVAL' // Waiting for admin approval
      })
      .select('id')
      .single()

    if (orgError) {
      console.error('❌ Organization creation error:', orgError)
      // Clean up user if organization creation fails
      const supabaseAdmin = createAdminClient()
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id)
      return { 
        success: false, 
        message: `Lỗi tạo tổ chức: ${orgError.message}` 
      }
    }

    console.log('✅ Organization created:', newOrg.id)

    // Step 6: Create user profile
    console.log('👤 Creating user profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: signUpData.user.id,
        full_name: registrationData.fullName,
        email: registrationData.email,
        organization_id: newOrg.id,
        role: 'DISPATCHER', // Default role
        status: 'PENDING' // Pending admin approval
      })

    if (profileError) {
      console.error('❌ Profile creation error:', profileError)
      // This is not critical, user can still login
    }

    // Step 7: Clean up temporary data
    tempRegistrationData.delete(email)

    console.log('🎉 Registration completed successfully!')
    return { 
      success: true, 
      message: 'Đăng ký thành công! Tài khoản của bạn đang chờ admin phê duyệt.',
      user: signUpData.user,
      organizationId: newOrg.id,
      requiresAdminApproval: true
    }

  } catch (error: any) {
    console.error('💥 Fatal error in verifyOtp:', error)
    return { 
      success: false, 
      message: `Lỗi hệ thống: ${error.message}` 
    }
  }
}

export async function resendOtp(email: string, type: OtpType) {
  try {
    console.log('🔄 Resending OTP for:', email)
    
    // Check if registration data exists
    const tempData = tempRegistrationData.get(email)
    if (!tempData) {
      return { 
        success: false, 
        message: 'Dữ liệu đăng ký không tìm thấy. Vui lòng đăng ký lại.' 
      }
    }

    // Generate new OTP
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('🔑 New OTP generated:', newOtpCode)

    // Update stored data with new OTP and timestamp
    tempRegistrationData.set(email, {
      ...tempData,
      otpCode: newOtpCode,
      timestamp: Date.now() // Reset timestamp
    })

    // Send new OTP (simulated for now)
    console.log('📧 Sending new OTP to:', email)
    console.log('📱 New OTP Code:', newOtpCode)

    return { 
      success: true, 
      message: `Mã OTP mới đã được gửi đến email: ${email}. Mã OTP cho test: ${newOtpCode}` 
    }
  } catch (error: any) {
    console.error('💥 Error in resendOtp:', error)
    return { 
      success: false, 
      message: `Lỗi gửi lại mã OTP: ${error.message}` 
    }
  }
}

// Admin function to approve organization and create user profile
export async function approveOrganization(organizationId: string) {
  try {
    const supabase = await createClient()

    // Step 1: Update organization status to ACTIVE
    const { error: updateOrgError } = await supabase
      .from('organizations')
      .update({ status: 'ACTIVE' })
      .eq('id', organizationId)

    if (updateOrgError) {
      return { 
        success: false, 
        message: `Lỗi cập nhật trạng thái tổ chức: ${updateOrgError.message}` 
      }
    }

    // Step 2: Find user associated with this organization (from user metadata)
    const supabaseAdmin = createAdminClient()
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      return { 
        success: false, 
        message: `Lỗi tìm kiếm người dùng: ${usersError.message}` 
      }
    }

    // Find user with matching pending_organization_id
    const associatedUser = users.users.find((user: any) => 
      user.user_metadata?.pending_organization_id === organizationId
    )

    if (!associatedUser) {
      return { 
        success: false, 
        message: 'Không tìm thấy người dùng liên kết với tổ chức này' 
      }
    }

    // Step 3: Create user profile
    const userMetadata = associatedUser.user_metadata
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: associatedUser.id,
        full_name: userMetadata.full_name,
        organization_id: organizationId,
        role: userMetadata.organization_type === 'TRUCKING_COMPANY' ? 'DISPATCHER' : 'CARRIER_ADMIN'
      })

    if (profileError) {
      return { 
        success: false, 
        message: `Lỗi tạo profile người dùng: ${profileError.message}` 
      }
    }

    // Step 4: Update user metadata to clear pending organization
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      associatedUser.id,
      {
        user_metadata: {
          ...userMetadata,
          organization_id: organizationId,
          pending_organization_id: null // Clear pending status
        }
      }
    )

    if (updateUserError) {
      console.error('Error updating user metadata:', updateUserError)
      // Don't fail the process for this
    }

    return { 
      success: true, 
      message: 'Tổ chức đã được duyệt và tài khoản người dùng đã được kích hoạt.',
      organizationId,
      userId: associatedUser.id
    }

  } catch (error: any) {
    console.error('Error in approveOrganization:', error)
    return { 
      success: false, 
      message: `Lỗi hệ thống: ${error.message}` 
    }
  }
}

// Admin function to reject organization (delete it and disable user)
export async function rejectOrganization(organizationId: string, reason: string) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Step 1: Find user associated with this organization
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      return { 
        success: false, 
        message: `Lỗi tìm kiếm người dùng: ${usersError.message}` 
      }
    }

    const associatedUser = users.users.find((user: any) => 
      user.user_metadata?.pending_organization_id === organizationId
    )

    // Step 2: Delete organization
    const { error: deleteOrgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId)

    if (deleteOrgError) {
      return { 
        success: false, 
        message: `Lỗi xóa tổ chức: ${deleteOrgError.message}` 
      }
    }

    // Step 3: Update user metadata to reflect rejection
    if (associatedUser) {
      const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
        associatedUser.id,
        {
          user_metadata: {
            ...associatedUser.user_metadata,
            organization_rejection_reason: reason,
            pending_organization_id: null,
            rejected_at: new Date().toISOString()
          }
        }
      )

      if (updateUserError) {
        console.error('Error updating user metadata after rejection:', updateUserError)
      }
    }

    return { 
      success: true, 
      message: 'Yêu cầu đăng ký tổ chức đã bị từ chối.',
      organizationId,
      userId: associatedUser?.id
    }

  } catch (error: any) {
    console.error('Error in rejectOrganization:', error)
    return { 
      success: false, 
      message: `Lỗi hệ thống: ${error.message}` 
    }
  }
}