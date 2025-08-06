import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// NEW: Timezone-aware datetime utilities for Vietnam (+7)
export function formatDateTimeVN(date: string | Date): string {
  const d = new Date(date)
  // Format specifically for Vietnam timezone display
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
}

// Format datetime for display - handles UTC stored data correctly
export function formatStoredDateTimeVN(utcDateTime: string | Date): string {
  if (!utcDateTime) return ''
  
  // Convert UTC datetime back to Vietnam local time for display
  const utcDate = new Date(utcDateTime)
  const vnOffset = 7 * 60 // Vietnam is UTC+7 (420 minutes)
  const localTime = utcDate.getTime() + (vnOffset * 60 * 1000)
  const localDate = new Date(localTime)
  
  // Format the local date without timezone conversion
  return localDate.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateVN(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
}

// Convert datetime-local input value to proper timezone for storage
export function datetimeLocalToUTC(datetimeLocal: string): string {
  if (!datetimeLocal) return ''
  
  // datetime-local gives us YYYY-MM-DDTHH:mm
  // We need to treat this as Vietnam local time and convert to UTC for storage
  const localDate = new Date(datetimeLocal)
  
  // Create a date with Vietnam timezone offset
  const vnOffset = 7 * 60 // Vietnam is UTC+7 (420 minutes)
  const utcTime = localDate.getTime() - (vnOffset * 60 * 1000)
  
  return new Date(utcTime).toISOString()
}

// Convert UTC datetime from database to datetime-local input format
export function utcToDatetimeLocal(utcDateTime: string): string {
  if (!utcDateTime) return ''
  
  const utcDate = new Date(utcDateTime)
  
  // Add Vietnam timezone offset to display the original selected time
  const vnOffset = 7 * 60 // Vietnam is UTC+7 (420 minutes)
  const localTime = utcDate.getTime() + (vnOffset * 60 * 1000)
  const localDate = new Date(localTime)
  
  // Format for datetime-local input (YYYY-MM-DDTHH:mm)
  return localDate.toISOString().slice(0, 16)
}

// Convert UTC datetime to Vietnam local time for display without offset issues
export function utcToVNLocal(utcDateTime: string): Date {
  if (!utcDateTime) return new Date()
  
  const utcDate = new Date(utcDateTime)
  const vnOffset = 7 * 60 // Vietnam is UTC+7 (420 minutes)
  const localTime = utcDate.getTime() + (vnOffset * 60 * 1000)
  
  return new Date(localTime)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Container type utilities
export const containerTypes = [
  { value: '20DC', label: '20ft Dry Container' },
  { value: '40DC', label: '40ft Dry Container' },
  { value: '40HC', label: '40ft High Cube' },
  { value: '45HC', label: '45ft High Cube' },
  { value: '20RF', label: '20ft Reefer' },
  { value: '40RF', label: '40ft Reefer' },
]

export function getContainerTypeLabel(type: string): string {
  return containerTypes.find(ct => ct.value === type)?.label || type
}

// Status utilities  
export function getStatusColor(status: string): string {
  switch (status) {
    case 'AVAILABLE':
    case 'APPROVED':
    case 'COMPLETED':
      return 'text-green-700 bg-green-100'
    case 'PENDING':
    case 'AWAITING_REUSE_APPROVAL':
    case 'AWAITING_COD_APPROVAL':
      return 'text-yellow-700 bg-yellow-100'
    case 'AWAITING_COD_PAYMENT':
    case 'AWAITING_REUSE_PAYMENT':
      return 'text-orange-700 bg-orange-100'
    case 'ON_GOING_COD':
    case 'ON_GOING_REUSE':
      return 'text-blue-700 bg-blue-100'
    case 'DEPOT_PROCESSING':
      return 'text-purple-700 bg-purple-100'
    case 'DECLINED':
    case 'COD_REJECTED':
    case 'REUSE_REJECTED':
      return 'text-red-700 bg-red-100'
    default:
      return 'text-gray-700 bg-gray-100'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Sẵn sàng'
    case 'AWAITING_REUSE_APPROVAL':
      return 'Chờ duyệt Re-use'
    case 'AWAITING_COD_APPROVAL':
      return 'Chờ duyệt COD'
    case 'AWAITING_COD_PAYMENT':
      return 'Chờ thanh toán phí COD'
    case 'AWAITING_REUSE_PAYMENT':
      return 'Chờ thanh toán phí Re-use'
    case 'ON_GOING_COD':
      return 'Đang thực hiện COD'
    case 'ON_GOING_REUSE':
      return 'Đang thực hiện Re-use'
    case 'DEPOT_PROCESSING':
      return 'Đang xử lý tại Depot'
    case 'COMPLETED':
      return 'Hoàn tất'
    case 'COD_REJECTED':
      return 'Bị từ chối COD'
    case 'REUSE_REJECTED':
      return 'Bị từ chối Re-use'
    case 'PENDING':
      return 'Chờ xử lý'
    case 'APPROVED':
      return 'Đã phê duyệt'
    case 'DECLINED':
      return 'Đã từ chối'
    default:
      return status
  }
}

// Organization type utilities
export function getOrgTypeLabel(type: string): string {
  switch (type) {
    case 'TRUCKING_COMPANY':
      return 'Công ty Vận tải'
    case 'SHIPPING_LINE':
      return 'Hãng tàu'
    default:
      return type
  }
}

// Role utilities
export function getRoleLabel(role: string): string {
  switch (role) {
    case 'DISPATCHER':
      return 'Điều phối viên'
    case 'CARRIER_ADMIN':
      return 'Quản trị viên Hãng tàu'
    default:
      return role
  }
}

// ISO 6346 Container Number Validation
export function validateContainerNumber(containerNo: string): boolean {
  if (!containerNo || containerNo.length !== 11) {
    return false;
  }

  containerNo = containerNo.toUpperCase();
  const ownerCode = containerNo.substring(0, 3);
  const categoryId = containerNo.substring(3, 4);
  const serialNumber = containerNo.substring(4, 10);
  const checkDigit = parseInt(containerNo.substring(10, 11), 10);

  // Validate basic format
  // Owner code: 3 chữ cái
  // Category ID: U (container thông thường), J (container có thiết bị), Z (trailer/chassis)
  // Serial number: 6 chữ số
  if (!/^[A-Z]{3}$/.test(ownerCode) || 
      !/^[UJZR]$/.test(categoryId) || 
      !/^\d{6}$/.test(serialNumber) || 
      isNaN(checkDigit)) {
    console.log('Invalid format:', {
      ownerCode,
      categoryId,
      serialNumber,
      checkDigit
    });
    return false;
  }

  return true;
}
