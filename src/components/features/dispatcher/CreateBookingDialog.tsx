'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AddExportBookingForm from '@/components/dispatcher/AddExportBookingForm'
import type { Organization } from '@/lib/types'

interface CreateBookingDialogProps {
  shippingLines: Organization[]
  onSuccess?: () => void
}

export default function CreateBookingDialog({ shippingLines, onSuccess }: CreateBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      onSuccess?.()
    }
  }

  return (
    <>
      <Button 
        className="bg-primary hover:bg-primary/90 text-white"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Thêm Lệnh Lấy Rỗng
      </Button>
      
      <AddExportBookingForm
        shippingLines={shippingLines}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  )
} 