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
  version: '1.0.0',
  description: 'Hệ thống tối ưu hóa Re-use container'
} as const

/**
 * Navigation routes
 */
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/reports',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DISPATCHER: '/dispatcher',
  CARRIER_ADMIN: '/carrier-admin',
  MARKETPLACE: '/marketplace',
  ACCOUNT: '/account'
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
  { value: 'unlimited', label: 'Không giới hạn' },
  { value: '50', label: 'Trong vòng 50km' },
  { value: '100', label: 'Trong vòng 100km' },
  { value: '200', label: 'Trong vòng 200km' },
  { value: '500', label: 'Trong vòng 500km' }
] as const

/**
 * Partner rating filter options
 */
export const RATING_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả đánh giá' },
  { value: '4', label: '4 sao trở lên' },
  { value: '3', label: '3 sao trở lên' },
  { value: '2', label: '2 sao trở lên' }
] as const

/**
 * Organization types
 */
export const ORGANIZATION_TYPES = [
  { value: 'SHIPPING_LINE', label: 'Hãng Tàu' },
  { value: 'TRUCKING_COMPANY', label: 'Công ty Vận tải' },
  { value: 'FREIGHT_FORWARDER', label: 'Công ty Logistics' },
  { value: 'TERMINAL_OPERATOR', label: 'Nhà điều hành cảng' }
]

/**
 * User roles
 */
export const USER_ROLES = [
  { value: 'DISPATCHER', label: 'Điều phối viên' },
  { value: 'CARRIER_ADMIN', label: 'Quản trị viên hãng tàu' },
  { value: 'SYSTEM_ADMIN', label: 'Quản trị viên hệ thống' }
]

/**
 * Status options for various entities
 */
export const STATUS_OPTIONS = {
  IMPORT_CONTAINER: [
    { value: 'AVAILABLE', label: 'Lệnh mới tạo', color: 'green' },
    { value: 'AWAITING_REUSE_APPROVAL', label: 'Chờ duyệt Re-use', color: 'yellow' },
    { value: 'AWAITING_COD_APPROVAL', label: 'Chờ duyệt thay đổi địa điểm', color: 'yellow' },
    { value: 'AWAITING_COD_PAYMENT', label: 'Chờ thanh toán phí thay đổi địa điểm', color: 'orange' },
    { value: 'AWAITING_REUSE_PAYMENT', label: 'Chờ thanh toán phí Re-use', color: 'orange' },
    { value: 'ON_GOING_COD', label: 'Đang thực hiện thay đổi địa điểm', color: 'blue' },
  { value: 'ON_GOING_REUSE', label: 'Đang thực hiện Re-use', color: 'blue' },
    { value: 'DEPOT_PROCESSING', label: 'Đang xử lý tại Depot', color: 'purple' },
    { value: 'COMPLETED', label: 'Hoàn tất', color: 'green' },
    { value: 'COD_REJECTED', label: 'Bị từ chối COD', color: 'red' },
    { value: 'REUSE_REJECTED', label: 'Bị từ chối Re-use', color: 'red' }
  ],
  EXPORT_BOOKING: [
    { value: 'PENDING', label: 'Đang chờ', color: 'yellow' },
    { value: 'MATCHED', label: 'Đã ghép nối', color: 'blue' },
    { value: 'FULFILLED', label: 'Đã hoàn thành', color: 'green' }
  ],
  STREET_TURN_REQUEST: [
    { value: 'PENDING', label: 'Chờ duyệt', color: 'yellow' },
    { value: 'APPROVED', label: 'Đã duyệt', color: 'green' },
    { value: 'DECLINED', label: 'Bị từ chối', color: 'red' }
  ]
}

/**
 * Depot locations in Vietnam
 */
export const DEPOT_LOCATIONS = [
  {
    id: 'hcm-cat-lai',
    name: 'Cảng Cát Lái',
    city: 'TP. Hồ Chí Minh',
    address: 'Khu vực cảng Cát Lái, Quận 2, TP. Hồ Chí Minh',
    coordinates: { lat: 10.7903, lng: 106.7581 }
  },
  {
    id: 'hcm-hiep-phuoc',
    name: 'Cảng Hiệp Phước',
    city: 'TP. Hồ Chí Minh',
    address: 'Khu Công nghiệp Hiệp Phước, Huyện Nhà Bè, TP. Hồ Chí Minh',
    coordinates: { lat: 10.6832, lng: 106.7043 }
  },
  {
    id: 'hanoi-noi-bai',
    name: 'ICD Nội Bài',
    city: 'Hà Nội',
    address: 'Sóc Sơn, Hà Nội',
    coordinates: { lat: 21.2187, lng: 105.8042 }
  },
  {
    id: 'hai-phong-lach-huyen',
    name: 'Cảng Lạch Huyện',
    city: 'Hải Phòng',
    address: 'Huyện An Dương, Hải Phòng',
    coordinates: { lat: 20.7537, lng: 106.7638 }
  },
  {
    id: 'da-nang-tien-sa',
    name: 'Cảng Tiên Sa',
    city: 'Đà Nẵng',
    address: 'Quận Sơn Trà, Đà Nẵng',
    coordinates: { lat: 16.1063, lng: 108.2633 }
  }
]