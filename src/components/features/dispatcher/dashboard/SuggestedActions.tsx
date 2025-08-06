'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRightLeft, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface SuggestedAction {
  id: string
  title: string
  description: string
  variant: 'default' | 'secondary' | 'outline'
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  priority: 'high' | 'medium' | 'low'
}

interface SuggestedActionsProps {
  actions: SuggestedAction[]
  status: string
}

export function SuggestedActions({ actions, status }: SuggestedActionsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          text: 'Sẵn sàng xử lý'
        }
      case 'PENDING':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          text: 'Chờ duyệt'
        }
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          text: 'Đã hoàn tất'
        }
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          text: 'Không xác định'
        }
    }
  }

  const statusInfo = getStatusInfo(status)
} 