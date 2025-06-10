import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

export function getDefaultPageForRole(role: string): string {
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