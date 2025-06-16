'use client'

import { Loader2, Package } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useCargoTypes } from '@/hooks/useCargoTypes'

interface CargoTypeSelectProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  label?: string
  name?: string
  id?: string
  error?: string
  className?: string
}

export default function CargoTypeSelect({
  value,
  onChange,
  required = false,
  label = "Loại Hàng Hóa",
  name = "cargo_type_id",
  id = "cargo_type_id",
  error,
  className = "w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
}: CargoTypeSelectProps) {
  const { cargoOptions, loading: cargoLoading, error: cargoError } = useCargoTypes()

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center">
        <Package className="w-4 h-4 mr-2" />
        {label}
        {required && ' *'}
      </Label>
      
      {cargoLoading ? (
        <div className="flex items-center justify-center py-3 border border-border rounded-md">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Đang tải danh sách loại hàng hóa...</span>
        </div>
      ) : cargoError ? (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {cargoError}
        </div>
      ) : (
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleSelectChange}
          className={className}
          required={required}
        >
          <option value="">Chọn loại hàng hóa</option>
          {cargoOptions.map((cargo) => (
            <option key={cargo.value} value={cargo.value} title={cargo.description}>
              {cargo.label}
              {cargo.requiresSpecialHandling && ' (Xử lý đặc biệt)'}
            </option>
          ))}
        </select>
      )}
      
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
} 