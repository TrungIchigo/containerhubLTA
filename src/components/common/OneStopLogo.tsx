'use client'

import { cn } from '@/lib/utils'

interface OneStopLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  variant?: 'default' | 'white' | 'gradient'
}

export function OneStopLogo({ 
  size = 'md', 
  className,
  showText = true,
  variant = 'default'
}: OneStopLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl', 
    xl: 'text-3xl'
  }

  const getLogoColors = () => {
    switch (variant) {
      case 'white':
        return {
          container: 'bg-white/20 border-white/30',
          innerContainer: 'bg-white/60',
          cube: 'bg-white'
        }
      case 'gradient':
        return {
          container: 'bg-gradient-to-br from-green-400 via-green-500 to-emerald-600',
          innerContainer: 'bg-white/20',
          cube: 'bg-white/80'
        }
      default:
        return {
          container: 'bg-gradient-to-br from-green-500 to-emerald-600',
          innerContainer: 'bg-white/20 border-white/30',
          cube: 'bg-white/60'
        }
    }
  }

  const getTextColors = () => {
    switch (variant) {
      case 'white':
        return 'text-white'
      case 'gradient':
        return 'text-green-800'
      default:
        return 'text-green-800'
    }
  }

  const colors = getLogoColors()
  const textColors = getTextColors()

  return (
    <div className={cn('flex items-center gap-3 pl-4 pt-4', className)}>
      {/* Hexagonal Container Logo */}
      <div className={cn(
        'rounded-lg flex items-center justify-center relative overflow-hidden',
        sizeClasses[size],
        colors.container
      )}>
        {/* Hexagonal shape effect with CSS borders */}
        <div className="absolute inset-1 transform">
          <div className={cn(
            'w-full h-full rounded border-2 flex items-center justify-center',
            colors.innerContainer
          )}>
            {/* Inner cube representation */}
            <div className={cn(
              'rounded transform rotate-12 shadow-sm',
              size === 'sm' ? 'w-3 h-3' :
              size === 'md' ? 'w-4 h-4' :
              size === 'lg' ? 'w-6 h-6' : 'w-8 h-8',
              colors.cube
            )}>
            </div>
          </div>
        </div>
        
        {/* Floating elements around the logo */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-400 rounded transform rotate-45 opacity-70"></div>
        <div className="absolute -top-0.5 left-2 w-1.5 h-1.5 bg-green-300 rounded transform rotate-12 opacity-60"></div>
        <div className="absolute top-1 -left-0.5 w-1 h-1 bg-green-500 rounded opacity-50"></div>
      </div>

      {/* Text */}
      {showText && (
        <div className={cn('font-bold', textSizeClasses[size], textColors)}>
          OneStop@LTA
        </div>
      )}
    </div>
  )
}

// Simplified version for icons and small spaces
export function OneStopIcon({ 
  size = 'md',
  className,
  variant = 'default'
}: Omit<OneStopLogoProps, 'showText'>) {
  return (
    <OneStopLogo 
      size={size}
      className={className}
      showText={false}
      variant={variant}
    />
  )
} 