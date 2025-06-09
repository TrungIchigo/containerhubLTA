'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface TimeFilterProps {
  className?: string
}

const timeRangeOptions = [
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'year', label: 'Năm nay' },
  { value: 'custom', label: 'Tùy chọn' }
]

const getDateRange = (range: string) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (range) {
    case 'week':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    
    case 'month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3)
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1)
      return {
        start: startOfQuarter.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    
    case 'year':
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      return {
        start: startOfYear.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    
    default:
      // Default to last 30 days
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      return {
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
  }
}

export default function TimeFilter({ className }: TimeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentRange = searchParams.get('range') || 'month'
  const customStart = searchParams.get('start_date') || ''
  const customEnd = searchParams.get('end_date') || ''

  const handleRangeChange = (newRange: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newRange === 'custom') {
      params.set('range', newRange)
      // Keep existing custom dates if any
      if (customStart) params.set('start_date', customStart)
      if (customEnd) params.set('end_date', customEnd)
    } else {
      const { start, end } = getDateRange(newRange)
      params.set('range', newRange)
      params.set('start_date', start)
      params.set('end_date', end)
    }

    const query = params.toString()
    const url = query ? `/dashboard?${query}` : '/dashboard'
    router.push(url)
  }

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    params.set('range', 'custom')
    params.set(`${type}_date`, value)

    const query = params.toString()
    const url = query ? `/dashboard?${query}` : '/dashboard'
    router.push(url)
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Predefined Range Selector */}
      <select
        value={currentRange}
        onChange={(e) => handleRangeChange(e.target.value)}
        className="form-input w-auto min-w-[120px]"
      >
        {timeRangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Custom Date Inputs */}
      {currentRange === 'custom' && (
        <>
          <input
            type="date"
            value={customStart}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            className="form-input w-auto"
            placeholder="Từ ngày"
          />
          <span className="text-text-secondary text-sm">đến</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            className="form-input w-auto"
            placeholder="Đến ngày"
          />
        </>
      )}
    </div>
  )
} 