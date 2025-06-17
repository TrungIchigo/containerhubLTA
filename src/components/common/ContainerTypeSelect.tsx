'use client'

import { forwardRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useContainerTypes } from '@/hooks/useContainerTypes'
import { Loader2 } from 'lucide-react'

interface ContainerTypeSelectProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
}

const ContainerTypeSelect = forwardRef<HTMLButtonElement, ContainerTypeSelectProps>(
  ({ value, onValueChange, placeholder = "Chọn loại container", disabled = false, className, name }, ref) => {
    const { containerTypes, loading, error } = useContainerTypes()

    if (loading) {
      return (
        <div className="flex items-center space-x-2 p-3 border border-border rounded-md shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Đang tải...</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-3 border border-red-200 rounded-md shadow-sm text-red-600 text-sm">
          Lỗi tải dữ liệu: {error}
        </div>
      )
    }

    return (
      <Select 
        value={value} 
        onValueChange={onValueChange} 
        disabled={disabled}
        name={name}
      >
        <SelectTrigger className={className} ref={ref}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {containerTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex flex-col">
                <span className="font-medium">{type.name}</span>
                {type.description && (
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
)

ContainerTypeSelect.displayName = 'ContainerTypeSelect'

export default ContainerTypeSelect 