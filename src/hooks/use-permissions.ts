'use client';

import { useUser } from './use-user'
import { can, Permission, type UserWithProfile } from '@/lib/authorization'

export function usePermissions() {
  const { user } = useUser()

  // Tạo userWithProfile object từ user context
  const userWithProfile: UserWithProfile | null = user?.profile ? {
    id: user.id,
    email: user.email,
    profile: {
      role: user.profile.role,
      organization_id: user.profile.organization_id,
    }
  } : null

  const checkPermission = (permission: Permission): boolean => {
    return can(userWithProfile, permission)
  }

  const canApproveRequests = () => checkPermission(Permission.APPROVE_ANY_REQUEST)
  const canViewAdminDashboard = () => checkPermission(Permission.VIEW_ADMIN_DASHBOARD)
  const canCreateOrders = () => checkPermission(Permission.CREATE_DROPOFF_ORDER)
  const canCreateCodRequests = () => checkPermission(Permission.CREATE_COD_REQUEST)
  const canViewMarketplace = () => checkPermission(Permission.VIEW_MARKETPLACE)
  const canViewBillingDashboard = () => checkPermission(Permission.VIEW_BILLING_DASHBOARD)

  return { 
    checkPermission, 
    userWithProfile,
    // Convenience methods
    canApproveRequests,
    canViewAdminDashboard,
    canCreateOrders,
    canCreateCodRequests,
    canViewMarketplace,
    canViewBillingDashboard
  }
} 