'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function StarRating({ 
  value, 
  onChange, 
  readonly = false, 
  size = 'md',
  className 
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (hoverValue || value)
        
        return (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              readonly ? "cursor-default" : "cursor-pointer",
              "transition-colors",
              isActive 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
            )}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          />
        )
      })}
    </div>
  )
}

// Component để hiển thị rating (read-only)
interface RatingDisplayProps {
  rating: number
  reviewCount: number
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function RatingDisplay({ 
  rating, 
  reviewCount, 
  size = 'sm', 
  showText = true,
  className 
}: RatingDisplayProps) {
  if (reviewCount === 0) {
    return (
      <span className={cn("text-gray-500 text-sm", className)}>
        Chưa có đánh giá
      </span>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StarRating
        value={rating}
        onChange={() => {}}
        readonly
        size={size}
      />
      {showText && (
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({reviewCount} đánh giá)
        </span>
      )}
    </div>
  )
} 