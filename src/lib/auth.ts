import { getCurrentUser } from '@/lib/actions/auth'

/**
 * Get current user profile with role and organization info
 * This is a wrapper around getCurrentUser for backward compatibility
 */
export async function getCurrentProfile() {
  const user = await getCurrentUser()
  
  if (!user || !user.profile) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    role: user.profile.role,
    full_name: user.profile.full_name,
    organization_id: user.profile.organization_id,
    organization: user.profile.organization
  }
}

// Re-export other auth functions for convenience
export { getCurrentUser } from '@/lib/actions/auth'