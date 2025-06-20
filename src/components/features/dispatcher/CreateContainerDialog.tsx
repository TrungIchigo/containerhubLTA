'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AddImportContainerForm from '@/components/dispatcher/AddImportContainerForm'
import type { Organization } from '@/lib/types'

interface CreateContainerDialogProps {
  shippingLines: Organization[]
  onSuccess?: () => void
}

export default function CreateContainerDialog({ shippingLines, onSuccess }: CreateContainerDialogProps) {
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
        Thêm Lệnh Giao Trả
      </Button>
      
      <AddImportContainerForm
        shippingLines={shippingLines}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  )
} 