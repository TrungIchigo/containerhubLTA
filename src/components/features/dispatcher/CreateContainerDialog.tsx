'use client'

import { useState } from 'react'
import AddImportContainerForm from '@/components/dispatcher/AddImportContainerForm'
import type { Organization } from '@/lib/types'

interface CreateContainerDialogProps {
  shippingLines: Organization[]
  onSuccess?: () => void
}

export default function CreateContainerDialog({ shippingLines, onSuccess }: CreateContainerDialogProps) {
  const [isOpen, setIsOpen] = useState(true) // Mở ngay khi component được render

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      onSuccess?.()
    }
  }

  return (
    <AddImportContainerForm
      shippingLines={shippingLines}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    />
  )
} 