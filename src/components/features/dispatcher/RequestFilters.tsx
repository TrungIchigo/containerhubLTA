'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface RequestFiltersProps {
  className?: string
}

const statusOptions = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'DECLINED', label: 'Bị từ chối' },
]

export default function RequestFilters({ className }: RequestFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams?.get('search') || '')
  const [status, setStatus] = useState(searchParams?.get('status') || '')

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      
      if (search) {
        params.set('search', search)
      } else {
        params.delete('search')
      }
      
      // Keep existing status
      if (status) {
        params.set('status', status)
      } else {
        params.delete('status')
      }

      const query = params.toString()
      const url = query ? `/dispatcher/requests?${query}` : '/dispatcher/requests'
      router.push(url)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [search, router, searchParams, status])

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    
    const params = new URLSearchParams(searchParams?.toString() || '')
    
    if (newStatus) {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }
    
    // Keep existing search
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }

    const query = params.toString()
    const url = query ? `/dispatcher/requests?${query}` : '/dispatcher/requests'
    router.push(url)
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 mb-6 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
        <Input
          type="text"
          placeholder="Tìm kiếm theo số container hoặc booking..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Status Filter */}
      <div className="sm:w-48">
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="form-input"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}