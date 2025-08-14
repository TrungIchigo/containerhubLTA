'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Cập nhật thông tin profile của người dùng
 * @param profileData - Dữ liệu profile cần cập nhật
 * @returns Promise với kết quả thành công hoặc lỗi
 */
export async function updateUserProfile(profileData: {
  full_name: string | null
  phone_number?: string | null
  avatar_url?: string | null
}) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Không thể xác thực người dùng'
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Add fields if provided
    if (profileData.full_name !== undefined) {
      updateData.full_name = profileData.full_name
    }
    if (profileData.phone_number !== undefined) {
      updateData.phone_number = profileData.phone_number
    }
    if (profileData.avatar_url !== undefined) {
      updateData.avatar_url = profileData.avatar_url
    }

    // Update profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return {
        success: false,
        error: 'Không thể cập nhật thông tin hồ sơ'
      }
    }

    // Update display name in Supabase Auth if full_name is provided
    if (profileData.full_name !== undefined) {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          display_name: profileData.full_name
        }
      })

      if (authError) {
        console.error('Auth update error:', authError)
        // Don't fail the entire operation if auth update fails
        // Profile table is already updated successfully
      }
    }

    return {
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!'
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'Có lỗi không mong muốn xảy ra'
    }
  }
}

/**
 * Thay đổi mật khẩu người dùng
 * @param passwordData - Dữ liệu mật khẩu cần thay đổi
 * @returns Promise với kết quả thành công hoặc lỗi
 */
export async function changeUserPassword(passwordData: {
  currentPassword: string
  newPassword: string
}) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Không thể xác thực người dùng'
      }
    }

    // Verify current password by trying to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: passwordData.currentPassword
    })

    if (verifyError) {
      return {
        success: false,
        error: 'Mật khẩu hiện tại không chính xác'
      }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: passwordData.newPassword
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return {
        success: false,
        error: 'Không thể cập nhật mật khẩu. Vui lòng thử lại sau.'
      }
    }

    return {
      success: true,
      message: 'Thay đổi mật khẩu thành công!'
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'Có lỗi không mong muốn xảy ra'
    }
  }
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    throw new Error('Không thể đăng xuất')
  }
  
  redirect('/login')
}

export async function validateCurrentPassword(currentPassword: string) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Không thể xác thực người dùng'
      }
    }

    // Verify current password by trying to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (verifyError) {
      return {
        success: false,
        error: 'Mật khẩu không chính xác'
      }
    }

    return {
      success: true,
      message: 'Mật khẩu chính xác'
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'Có lỗi không mong muốn xảy ra'
    }
  }
}