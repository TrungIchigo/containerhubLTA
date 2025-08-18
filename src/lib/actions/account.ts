'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

/**
 * Updates user profile with enhanced information including phone number and avatar
 * @param data - Profile data to update
 * @returns Promise with success status and optional error message
 */
export async function updateUserProfileEnhanced(data: {
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Không tìm thấy thông tin người dùng' };
  }
  
  try {
    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone_number: data.phone_number || null,
        avatar_url: data.avatar_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (profileError) {
      throw profileError;
    }
    
    // Update display name in auth
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: data.full_name,
        avatar_url: data.avatar_url,
      }
    });
    
    if (authError) {
      throw authError;
    }
    
    revalidatePath('/account');
    return { success: true };
    
  } catch (error) {
    console.error('Error updating profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật thông tin' 
    };
  }
}

/**
 * Uploads user avatar to Supabase Storage
 * @param file - Avatar image file
 * @returns Promise with success status, URL and optional error message
 */
export async function uploadUserAvatar(file: File) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Không tìm thấy thông tin người dùng' };
  }
  
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);
    
    return { success: true, url: publicUrl };
    
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải lên ảnh đại diện' 
    };
  }
}

/**
 * Links user account with eDepot credentials
 * @param credentials - eDepot username and password
 * @returns Promise with success status and optional error message
 */
export async function linkEDepotAccount(credentials: {
  username: string;
  password: string;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Không tìm thấy thông tin người dùng' };
  }
  
  try {
    // TODO: Validate eDepot credentials with external API
    // For now, we'll just store the credentials (encrypted in production)
    
    const { error } = await supabase
      .from('profiles')
      .update({
        edepot_linked: true,
        edepot_username: credentials.username,
        // Note: In production, password should be encrypted
        edepot_credentials: JSON.stringify({
          username: credentials.username,
          // Store encrypted password here
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (error) {
      throw error;
    }
    
    revalidatePath('/account');
    return { success: true };
    
  } catch (error) {
    console.error('Error linking eDepot account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi liên kết tài khoản eDepot' 
    };
  }
}

/**
 * Unlinks user account from eDepot
 * @returns Promise with success status and optional error message
 */
export async function unlinkEDepotAccount() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Không tìm thấy thông tin người dùng' };
  }
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        edepot_linked: false,
        edepot_username: null,
        edepot_credentials: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (error) {
      throw error;
    }
    
    revalidatePath('/account');
    return { success: true };
    
  } catch (error) {
    console.error('Error unlinking eDepot account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi hủy liên kết tài khoản eDepot' 
    };
  }
}

/**
 * Fetches comprehensive user data including profile and organization info
 * @returns Promise with user data or error
 */
export async function getUserComprehensiveData() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Không tìm thấy thông tin người dùng' };
  }
  
  try {
    // Fetch user profile with organization data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        organizations (
          id,
          name,
          type,
          created_at
        )
      `)
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    return { 
      success: true, 
      data: {
        user: {
          id: user.id,
          email: user.email,
          ...profile
        },
        organization: profile.organizations
      }
    };
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải thông tin người dùng' 
    };
  }
}