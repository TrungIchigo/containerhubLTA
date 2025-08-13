import { createClient } from '@supabase/supabase-js'

/**
 * Tạo Supabase admin client với service_role key
 * @description Client này có quyền admin để thực hiện các thao tác như tạo user, xóa user, etc.
 * @returns Supabase admin client
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables for admin client. Please check your .env.local file.\n' +
      'Required variables:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}