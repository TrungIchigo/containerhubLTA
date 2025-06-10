import { createClient } from '@/lib/supabase/server'

export async function debugUserData() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('Auth User:', user)
  console.log('Auth Error:', authError)
  
  if (!user) {
    return { error: 'No authenticated user' }
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single()

  console.log('Profile Data:', profile)
  console.log('Profile Error:', profileError)

  // Get all organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .order('type', { ascending: true })

  console.log('Organizations:', orgs)
  console.log('Organizations Error:', orgsError)

  return {
    user,
    profile,
    organizations: orgs,
    errors: { authError, profileError, orgsError }
  }
}

export async function debugCarrierData(orgId: string) {
  const supabase = await createClient()
  
  // Check if organization exists and is a shipping line
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  console.log('Organization:', org)
  console.log('Organization Error:', orgError)

  // Check street turn requests for this org
  const { data: requests, error: requestsError } = await supabase
    .from('street_turn_requests')
    .select('*')
    .eq('approving_org_id', orgId)

  console.log('Requests for org:', requests)
  console.log('Requests Error:', requestsError)

  return {
    organization: org,
    requests,
    errors: { orgError, requestsError }
  }
} 