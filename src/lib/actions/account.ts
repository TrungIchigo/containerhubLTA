'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateUserProfile(fullName: string) {
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

    // Update profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return {
        success: false,
        error: 'Không thể cập nhật thông tin hồ sơ'
      }
    }

    // Update display name in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        display_name: fullName
      }
    })

    if (authError) {
      console.error('Auth update error:', authError)
      // Don't fail the entire operation if auth update fails
      // Profile table is already updated successfully
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

export async function changeUserPassword(currentPassword: string, newPassword: string) {
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
        error: 'Mật khẩu hiện tại không chính xác'
      }
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
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