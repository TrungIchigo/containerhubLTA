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

/**
 * Vietnamese provinces and cities for location filter (Updated 2025)
 * Based on new administrative structure: 6 centrally-governed cities + 28 provinces
 * Total: 34 administrative units (effective from July 1, 2025)
 */
export const VIETNAM_PROVINCES = [
  // 6 Centrally-governed cities (Thành phố trực thuộc trung ương) - Priority first
  { value: 'Thành phố Hà Nội', label: 'Thành phố Hà Nội' },
  { value: 'Thành phố Hồ Chí Minh', label: 'Thành phố Hồ Chí Minh' },
  { value: 'Thành phố Đà Nẵng', label: 'Thành phố Đà Nẵng' },
  { value: 'Thành phố Hải Phòng', label: 'Thành phố Hải Phòng' },
  { value: 'Thành phố Huế', label: 'Thành phố Huế' },
  { value: 'Thành phố Cần Thơ', label: 'Thành phố Cần Thơ' },
  
  // 28 Provinces (Tỉnh) - Alphabetically sorted
  { value: 'An Giang', label: 'An Giang' },
  { value: 'Bạc Liêu', label: 'Bạc Liêu' },
  { value: 'Bắc Ninh', label: 'Bắc Ninh' },
  { value: 'Cà Mau', label: 'Cà Mau' },
  { value: 'Cao Bằng', label: 'Cao Bằng' },
  { value: 'Điện Biên', label: 'Điện Biên' },
  { value: 'Đắk Lắk', label: 'Đắk Lắk' },
  { value: 'Đồng Nai', label: 'Đồng Nai' },
  { value: 'Đồng Tháp', label: 'Đồng Tháp' },
  { value: 'Gia Lai', label: 'Gia Lai' },
  { value: 'Hà Tĩnh', label: 'Hà Tĩnh' },
  { value: 'Hưng Yên', label: 'Hưng Yên' },
  { value: 'Khánh Hòa', label: 'Khánh Hòa' },
  { value: 'Kiên Giang', label: 'Kiên Giang' },
  { value: 'Lai Châu', label: 'Lai Châu' },
  { value: 'Lâm Đồng', label: 'Lâm Đồng' },
  { value: 'Lạng Sơn', label: 'Lạng Sơn' },
  { value: 'Lào Cai', label: 'Lào Cai' },
  { value: 'Nghệ An', label: 'Nghệ An' },
  { value: 'Ninh Bình', label: 'Ninh Bình' },
  { value: 'Phú Thọ', label: 'Phú Thọ' },
  { value: 'Quảng Ngãi', label: 'Quảng Ngãi' },
  { value: 'Quảng Ninh', label: 'Quảng Ninh' },
  { value: 'Quảng Trị', label: 'Quảng Trị' },
  { value: 'Sơn La', label: 'Sơn La' },
  { value: 'Tây Ninh', label: 'Tây Ninh' },
  { value: 'Thái Nguyên', label: 'Thái Nguyên' },
  { value: 'Thanh Hóa', label: 'Thanh Hóa' },
  { value: 'Tuyên Quang', label: 'Tuyên Quang' },
  { value: 'Vĩnh Long', label: 'Vĩnh Long' }
] as const

/**
 * Maximum distance options for marketplace filter
 */
export const DISTANCE_OPTIONS = [
  { value: '10', label: '10km' },
  { value: '20', label: '20km' },
  { value: '30', label: '30km' },
  { value: '50', label: '50km' },
  { value: '100', label: '100km' },
  { value: 'unlimited', label: 'Không giới hạn' }
] as const

/**
 * Partner rating filter options
 */
export const RATING_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: '3', label: 'Từ 3 sao trở lên' },
  { value: '4', label: 'Từ 4 sao trở lên' }
] as const 