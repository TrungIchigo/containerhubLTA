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
    case 'CONFIRMED':
      return 'text-green-700 bg-green-100'
    case 'PENDING':
    case 'AWAITING_APPROVAL':
      return 'text-yellow-700 bg-yellow-100'
    case 'DECLINED':
      return 'text-red-700 bg-red-100'
    default:
      return 'text-gray-700 bg-gray-100'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Sẵn có'
    case 'AWAITING_APPROVAL':
      return 'Chờ phê duyệt'
    case 'CONFIRMED':
      return 'Đã xác nhận'
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
  if (!/^[A-Z]{3}$/.test(ownerCode) || categoryId !== 'U' || !/^\d{6}$/.test(serialNumber) || isNaN(checkDigit)) {
    return false;
  }
  
  // Letter to number mapping (skipping numbers divisible by 11)
  const letterValues: { [key: string]: number } = {
    A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20, K: 21, L: 23, M: 24,
    N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31, U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
  };

  let sum = 0;
  // Calculate weighted sum for first 4 characters (letters)
  for (let i = 0; i < 4; i++) {
    sum += letterValues[containerNo[i]] * Math.pow(2, i);
  }
  // Calculate weighted sum for next 6 digits
  for (let i = 4; i < 10; i++) {
    sum += parseInt(containerNo[i], 10) * Math.pow(2, i);
  }

  const calculatedCheckDigit = sum % 11;
  
  // Special case: if calculated check digit is 10, it becomes 0
  if (calculatedCheckDigit === 10) {
    return checkDigit === 0;
  }

  return calculatedCheckDigit === checkDigit;
}
