import * as React from 'react'
import { cn } from '@/lib/utils'
import { LtaLogo } from './ltalogo'

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Loader({ className, size = 'md' }: LoaderProps) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  }

  return (
    <div className={cn(sizes[size], className)}>
      <LtaLogo size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} />
    </div>
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