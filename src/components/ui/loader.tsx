import * as React from 'react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Loader({ className, size = 'md' }: LoaderProps) {
  const sizes = {
    sm: 'w-16 h-6',
    md: 'w-20 h-8', 
    lg: 'w-24 h-10'
  }

  return (
    <div 
      className={cn(
        "loader",
        sizes[size],
        className
      )}
      style={{
        '--g1': 'conic-gradient(from 90deg at left 3px top 3px, #0000 90deg, #4CAF50 0)',
        '--g2': 'conic-gradient(from -90deg at bottom 3px right 3px, #0000 90deg, #4CAF50 0)',
        background: 'var(--g1), var(--g1), var(--g1), var(--g2), var(--g2), var(--g2)',
        backgroundPosition: 'left, center, right',
        backgroundRepeat: 'no-repeat',
        animation: 'wave-loader 1s infinite'
      } as React.CSSProperties}
    />
  )
}

// Loading wrapper component for common use cases
interface LoadingProps {
  children?: React.ReactNode
  text?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ children, text = 'Đang tải...', size = 'md', className }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader size={size} />
      {text && (
        <p className="text-sm text-text-secondary">{text}</p>
      )}
      {children}
    </div>
  )
}

// Default export for convenience
export default Loader 