'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'
import { eDepotService } from '@/lib/services/edepot'
import { redirect } from 'next/navigation'

/**
 * Server Action để xử lý đăng nhập eDepot
 * @description Xác thực người dùng với eDepot API và tạo session trên Supabase
 * @param username Tên đăng nhập eDepot
 * @param password Mật khẩu eDepot
 * @returns Kết quả đăng nhập hoặc lỗi
 */
export async function loginWithEdepot(username: string, password: string) {
  
  if (!username || !password) {
    return { success: false, error: 'Vui lòng điền đầy đủ thông tin đăng nhập.' }
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  try {
    // Bước 1: Gọi API của eDepot để xác thực
    const edepotResponse = await eDepotService.login({ user: username, password })

    if (!edepotResponse.success || !edepotResponse.token || !edepotResponse.user) {
      return { success: false, error: edepotResponse.error || 'Thông tin đăng nhập eDepot không chính xác.' }
    }

    const edepotToken = edepotResponse.token
    const edepotUser = edepotResponse.user

    // Bước 2: Tìm hoặc Tạo người dùng trên i-ContainerHub
    // Tìm user qua user_metadata trong Supabase Auth
    const { data: usersList, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listUsersError) {
      console.error('Error listing users:', listUsersError)
      return { success: false, error: 'Không thể truy xuất danh sách người dùng.' }
    }
    
    if (!usersList?.users) {
      console.error('No users list returned from Supabase')
      return { success: false, error: 'Không thể truy xuất danh sách người dùng.' }
    }
    
    const existingAuthUser = usersList.users.find(user => 
      user.user_metadata?.edepot_username === username
    )
    
    let profile: any = null
    if (existingAuthUser) {
      // Lấy profile từ bảng profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, organization_id, role, full_name')
        .eq('id', existingAuthUser.id)
        .single()
      profile = existingProfile
    }

    if (!profile) {
      // --- Logic Tự động Tạo tài khoản (Just-in-Time Provisioning) ---
      
      // Tìm tổ chức mặc định cho eDepot users hoặc tạo mới
      let defaultOrgId: string
      
      // Tạo tên tổ chức riêng biệt cho mỗi eDepot user dựa trên username
      // Vì API eDepot không trả về organizationName đầy đủ, chúng ta tạo tên duy nhất
      const organizationName = edepotUser.organizationName || `eDepot Company ${username}`
      
      // Tạo tax_code duy nhất cho eDepot user
      const taxCode = `EDEPOT_${username}`
      
      // Tìm tổ chức eDepot theo tax_code trước (vì tax_code là unique)
      const { data: existingOrgByTaxCode } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('tax_code', taxCode)
        .single()

      if (existingOrgByTaxCode) {
        defaultOrgId = existingOrgByTaxCode.id
        console.log(`Using existing organization by tax_code: ${existingOrgByTaxCode.name} (${defaultOrgId})`)
      } else {
        // Nếu không tìm thấy theo tax_code, kiểm tra theo name và type
        const { data: existingOrgByName } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', organizationName)
          .eq('type', 'DEPOT')
          .single()

        if (existingOrgByName) {
          defaultOrgId = existingOrgByName.id
          console.log(`Using existing organization by name: ${organizationName} (${defaultOrgId})`)
        } else {
          // Tạo tổ chức mới cho eDepot user
          console.log('Creating new organization for eDepot user:', username, 'with name:', organizationName)
          const orgResult = await supabase
            .from('organizations')
            .insert({
              name: organizationName,
              type: 'DEPOT',
              status: 'ACTIVE', // eDepot users được tự động kích hoạt
              tax_code: taxCode,
              address: 'eDepot System',
              phone_number: '',
              representative_email: edepotUser.email || `${username}@edepot.user`
            })
            .select('id')
            .single()
          
          console.log('Organization creation result:', orgResult)
          const { data: newOrg, error: orgError } = orgResult

          if (orgError) {
            console.error('Error creating eDepot organization:', orgError)
            
            // Handle duplicate constraint error
            if (orgError.message?.includes('duplicate key value violates unique constraint')) {
              console.log('Duplicate constraint detected, trying to find existing organization...')
              
              // Try to find existing organization by tax_code again
              const { data: duplicateOrg } = await supabase
                .from('organizations')
                .select('id, name')
                .eq('tax_code', taxCode)
                .single()
              
              if (duplicateOrg) {
                defaultOrgId = duplicateOrg.id
                console.log(`Found existing organization after duplicate error: ${duplicateOrg.name} (${defaultOrgId})`)
              } else {
                return { success: false, error: 'Không thể tạo hoặc tìm thấy tổ chức cho người dùng eDepot.' }
              }
            } else {
              return { success: false, error: 'Không thể tạo tổ chức cho người dùng eDepot.' }
            }
          } else if (!newOrg) {
            return { success: false, error: 'Không thể tạo tổ chức cho người dùng eDepot.' }
          } else {
            defaultOrgId = newOrg.id
            console.log(`Created new organization: ${organizationName} (${defaultOrgId})`)
          }
        }
      }

      const userEmail = edepotUser.email || `${username}@edepot.user`
      console.log(`Processing eDepot user: ${username}, email: ${userEmail}, organization: ${organizationName}`)
      const randomPassword = randomBytes(16).toString('hex')

      // Tìm user theo email trong danh sách đã có (tránh gọi listUsers() lần nữa)
      const existingUserByEmail = usersList.users.find(user => 
        (user as { email: string }).email === userEmail
      )
      
      let userId: string
      
      if (existingUserByEmail) {
        // User đã tồn tại trong Auth, cập nhật metadata và tạo profile
        userId = existingUserByEmail.id
        console.log(`User already exists in Auth: ${userEmail}, updating metadata and creating profile`)
        
        // Cập nhật user_metadata nếu chưa có edepot_username
        if (!existingUserByEmail.user_metadata?.edepot_username) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                ...existingUserByEmail.user_metadata,
                edepot_username: username,
                source: 'edepot',
                full_name: edepotUser.fullName || `eDepot User ${username}`
              }
            }
          )
          
          if (updateError) {
            console.error('Error updating user metadata:', updateError)
            // Không return error ở đây vì user vẫn có thể đăng nhập được
          }
        }
      } else {
        // Tạo user mới trên Supabase Auth với admin privileges
        console.log(`Creating new Supabase user with email: ${userEmail}`)
        const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          password: randomPassword,
          email_confirm: true, // Tự động xác thực email
          user_metadata: {
            full_name: edepotUser.fullName || `eDepot User ${username}`,
            edepot_username: username,
            source: 'edepot'
          }
        })

        if (signUpError || !newUser.user) {
          console.error('Error creating Supabase user:', signUpError)
          return { success: false, error: 'Không thể tạo tài khoản người dùng.' }
        }
        
        userId = newUser.user.id
        console.log(`Successfully created Supabase user: ${userId} with email: ${userEmail}`)
      }

      // Kiểm tra xem profile đã tồn tại chưa
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, organization_id, role, full_name, email, edepot_username')
        .eq('id', userId)
        .single()

      if (existingProfile) {
        console.log('Profile already exists, checking for missing data')
        
        // Cập nhật profile nếu thiếu email hoặc edepot_username
        const needsUpdate = !existingProfile.email || !existingProfile.edepot_username
        
        if (needsUpdate) {
          console.log('Updating existing profile with missing data')
          const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              email: existingProfile.email || userEmail,
              edepot_username: existingProfile.edepot_username || username,
              full_name: existingProfile.full_name || edepotUser.fullName || `eDepot User ${username}`
            })
            .eq('id', userId)
            .select('id, organization_id, role, full_name, email, edepot_username')
            .single()
            
          if (updateError) {
            console.error('Error updating existing profile:', updateError)
          } else {
            profile = updatedProfile || existingProfile
          }
        } else {
          profile = existingProfile
        }
      } else {
        // Tạo profile mới cho user bằng admin client để bypass RLS
        console.log(`Creating new profile for user: ${userId}, email: ${userEmail}, org: ${defaultOrgId}`)
        const { data: newProfile, error: newProfileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            full_name: edepotUser.fullName || `eDepot User ${username}`,
            email: userEmail, // Lưu email vào profile
            organization_id: defaultOrgId,
            role: 'DISPATCHER', // Mặc định là DISPATCHER cho eDepot users
            edepot_username: username // Lưu eDepot username để liên kết
          })
          .select('id, organization_id, role, full_name, email, edepot_username')
          .single()

        if (newProfileError || !newProfile) {
          console.error('Error creating profile:', newProfileError)
          return { success: false, error: 'Không thể tạo hồ sơ người dùng.' }
        }
        
        console.log(`Successfully created profile: ${newProfile.id}, email: ${newProfile.email}, org: ${newProfile.organization_id}`)
        profile = newProfile
      }
    }

    // Bước 3: Tạo session trên Supabase cho người dùng đã được xác định
    // Lấy email từ Supabase Auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id)
    const userEmail = authUser?.user?.email || `${username}@edepot.user`
    
    // Sử dụng magic link để đăng nhập người dùng từ backend một cách an toàn
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail
    })

    if (linkError || !linkData) {
      console.error('Error generating magic link:', linkError)
      return { success: false, error: 'Không thể tạo liên kết đăng nhập.' }
    }

    // Verify OTP để tạo session
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token
    })

    if (sessionError || !sessionData.session) {
      console.error('Error creating session:', sessionError)
      return { success: false, error: 'Không thể tạo phiên đăng nhập.' }
    }

    // Set session cho user
    await supabase.auth.setSession(sessionData.session)

    // Lưu eDepot token vào session storage hoặc cookie nếu cần thiết
    // Có thể sử dụng để gọi các API khác của eDepot sau này
    
    // Xác định trang redirect dựa trên role
    const redirectTo = profile.role === 'CARRIER_ADMIN' ? '/carrier-admin' : '/dispatcher'
    
    return { 
      success: true, 
      redirectTo,
      message: 'Đăng nhập eDepot thành công!',
      user: {
        id: profile.id,
        email: userEmail,
        full_name: profile.full_name,
        role: profile.role,
        organization_id: profile.organization_id
      }
    }

  } catch (error: any) {
    console.error('eDepot login error:', error)
    return { 
      success: false,
      error: error.message || 'Đã xảy ra lỗi trong quá trình đăng nhập eDepot. Vui lòng thử lại.' 
    }
  }
}

/**
 * Kiểm tra xem user có tồn tại trong hệ thống eDepot không
 * @description Hàm helper để kiểm tra sự tồn tại của user trước khi đăng nhập
 * @param username Username cần kiểm tra
 * @returns Boolean indicating if user exists
 */
export async function checkEDepotUserExists(username: string): Promise<boolean> {
  try {
    return await eDepotService.checkUserExists(username)
  } catch (error) {
    console.error('Error checking eDepot user existence:', error)
    return false
  }
}

/**
 * Đồng bộ thông tin user từ eDepot sang Supabase
 * @description Cập nhật thông tin profile từ eDepot API
 * @param edepotUsername Username của eDepot
 * @returns Kết quả đồng bộ
 */
export async function syncEDepotUserData(edepotUsername: string) {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  
  try {
    // Tìm user qua user_metadata trong Supabase Auth
    const { data: usersList, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listUsersError) {
      console.error('Error listing users:', listUsersError)
      return { success: false, error: 'Không thể truy xuất danh sách người dùng.' }
    }
    
    if (!usersList?.users) {
      console.error('No users list returned from Supabase')
      return { success: false, error: 'Không thể truy xuất danh sách người dùng.' }
    }
    
    const existingAuthUser = usersList.users.find(user => 
      user.user_metadata?.edepot_username === edepotUsername
    )
    
    if (!existingAuthUser) {
      return { success: false, error: 'Không tìm thấy người dùng eDepot.' }
    }
    
    // Lấy thông tin profile hiện tại
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', existingAuthUser.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Không tìm thấy profile người dùng.' }
    }

    // TODO: Implement sync logic nếu cần thiết
    // Có thể gọi eDepot API để lấy thông tin mới nhất và cập nhật
    
    return { success: true, message: 'Đồng bộ thành công.' }
  } catch (error: any) {
    console.error('Sync eDepot user data error:', error)
    return { success: false, error: 'Lỗi đồng bộ dữ liệu người dùng.' }
  }
}