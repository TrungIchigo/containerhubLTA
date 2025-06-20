import { type User } from '@supabase/supabase-js';

// Định nghĩa các quyền (Permissions) một cách tường minh
export enum Permission {
  CREATE_DROPOFF_ORDER = 'CREATE_DROPOFF_ORDER',
  CREATE_COD_REQUEST = 'CREATE_COD_REQUEST',
  APPROVE_ANY_REQUEST = 'APPROVE_ANY_REQUEST', // Quyền duyệt bất kỳ yêu cầu nào
  VIEW_ADMIN_DASHBOARD = 'VIEW_ADMIN_DASHBOARD',
  MANAGE_ORGANIZATIONS = 'MANAGE_ORGANIZATIONS',
  VIEW_BILLING_DASHBOARD = 'VIEW_BILLING_DASHBOARD',
  CREATE_STREET_TURN_REQUEST = 'CREATE_STREET_TURN_REQUEST',
  VIEW_MARKETPLACE = 'VIEW_MARKETPLACE',
  CREATE_MARKETPLACE_REQUEST = 'CREATE_MARKETPLACE_REQUEST',
  // Thêm các quyền khác khi cần
}

// Kiểu dữ liệu cho người dùng đã được enrich với profile
export interface UserWithProfile {
  id: string;
  email?: string;
  profile: {
    role: 'DISPATCHER' | 'CARRIER_ADMIN' | 'PLATFORM_ADMIN' | null;
    organization_id: string | null;
    // các trường khác...
  } | null;
}

/**
 * Hàm trung tâm để kiểm tra một người dùng có quyền thực hiện một hành động cụ thể hay không.
 * @param user - Đối tượng người dùng đầy đủ (bao gồm cả profile).
 * @param permission - Quyền cần kiểm tra.
 * @returns boolean
 */
export function can(user: UserWithProfile | null, permission: Permission): boolean {
  if (!user || !user.profile) {
    return false;
  }

  const role = user.profile.role;

  switch (permission) {
    case Permission.VIEW_ADMIN_DASHBOARD:
    case Permission.MANAGE_ORGANIZATIONS:
    case Permission.VIEW_BILLING_DASHBOARD:
      // Chỉ Platform Admin mới có quyền xem Admin Dashboard
      return role === 'PLATFORM_ADMIN';

    case Permission.APPROVE_ANY_REQUEST:
      // Platform Admin và Carrier Admin đều có quyền duyệt yêu cầu
      return role === 'PLATFORM_ADMIN' || role === 'CARRIER_ADMIN';

    case Permission.CREATE_DROPOFF_ORDER:
    case Permission.CREATE_COD_REQUEST:
    case Permission.CREATE_STREET_TURN_REQUEST:
    case Permission.VIEW_MARKETPLACE:
    case Permission.CREATE_MARKETPLACE_REQUEST:
      // Chỉ Dispatcher mới có quyền tạo lệnh/yêu cầu
      return role === 'DISPATCHER';

    default:
      return false;
  }
}

/**
 * Kiểm tra xem người dùng có phải là Platform Admin không
 */
export function isPlatformAdmin(user: UserWithProfile | null): boolean {
  return can(user, Permission.VIEW_ADMIN_DASHBOARD);
}

/**
 * Kiểm tra xem người dùng có phải là Dispatcher không
 */
export function isDispatcher(user: UserWithProfile | null): boolean {
  return user?.profile?.role === 'DISPATCHER';
}

/**
 * Kiểm tra xem người dùng có phải là Carrier Admin không (legacy)
 */
export function isCarrierAdmin(user: UserWithProfile | null): boolean {
  return user?.profile?.role === 'CARRIER_ADMIN';
} 