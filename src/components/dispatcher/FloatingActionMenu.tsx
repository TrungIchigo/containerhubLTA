'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Container, Truck, X } from 'lucide-react'

interface FloatingActionMenuProps {
  onAddImport: () => void
  onAddExport: () => void
}

export default function FloatingActionMenu({ onAddImport, onAddExport }: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-2">
          <Button
            onClick={() => {
              onAddImport()
              setIsOpen(false)
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            size="sm"
          >
            <Container className="w-4 h-4" />
            Thêm Lệnh Trả Rỗng
          </Button>
          <Button
            onClick={() => {
              onAddExport()
              setIsOpen(false)
            }}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
            size="sm"
          >
            <Truck className="w-4 h-4" />
            Thêm Lệnh Lấy Rỗng
          </Button>
        </div>
      )}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary hover:bg-primary-dark text-white shadow-xl transition-all duration-200"
        size="icon"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </Button>
    </div>
  )
}