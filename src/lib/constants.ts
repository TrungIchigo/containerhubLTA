// Application Constants for i-ContainerHub@LTA

/**
 * Logo and branding assets
 */
export const LOGO_URL = 'https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets/logo.png'

/**
 * Application metadata
 */
export const APP_CONFIG = {
  name: 'i-ContainerHub@LTA',
  shortName: 'iC',
  description: 'Nền tảng tối ưu hóa logistics container',
  tagline: 'LTA Platform'
} as const

/**
 * Navigation routes
 */
export const ROUTES = {
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  REGISTER: '/register',
  DISPATCHER: '/dispatcher',
  CARRIER_ADMIN: '/carrier-admin',
  REQUESTS: '/dispatcher/requests'
} as const 