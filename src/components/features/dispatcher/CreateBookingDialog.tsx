'use client'

import { useState } from 'react'
import AddExportBookingForm from '@/components/dispatcher/AddExportBookingForm'
import type { Organization } from '@/lib/types'

interface CreateBookingDialogProps {
  shippingLines: Organization[]
  onSuccess?: () => void
}

export default function CreateBookingDialog({ shippingLines, onSuccess }: CreateBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(true) // Mở ngay khi component được render

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      onSuccess?.()
    }
  }

  return (
    <AddExportBookingForm
      shippingLines={shippingLines}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    />
  )
} 