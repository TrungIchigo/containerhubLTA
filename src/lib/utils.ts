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
