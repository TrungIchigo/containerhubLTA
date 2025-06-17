'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MiniChartProps {
  data: number[]
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  height?: number
}

export default function MiniChart({ 
  data, 
  trend = 'neutral', 
  className = '',
  height = 40 
}: MiniChartProps) {
  if (!data || data.length === 0) {
    return null
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  // Generate SVG path for line chart
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - min) / range) * 100
    return `${x},${y}`
  })

  const pathData = `M ${points.join(' L ')}`

  // Trend colors
  const trendConfig = {
    up: {
      stroke: '#22c55e', // green-500
      fill: 'rgba(34, 197, 94, 0.1)',
      icon: TrendingUp,
      iconColor: 'text-green-500'
    },
    down: {
      stroke: '#ef4444', // red-500
      fill: 'rgba(239, 68, 68, 0.1)',
      icon: TrendingDown,
      iconColor: 'text-red-500'
    },
    neutral: {
      stroke: '#6b7280', // gray-500
      fill: 'rgba(107, 114, 128, 0.1)',
      icon: Minus,
      iconColor: 'text-gray-500'
    }
  }

  const config = trendConfig[trend]
  const TrendIcon = config.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Mini SVG Chart */}
      <div className="flex-1">
        <svg 
          width="100%" 
          height={height}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Background area */}
          <defs>
            <linearGradient id={`gradient-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={config.stroke} stopOpacity="0.3" />
              <stop offset="100%" stopColor={config.stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            d={`${pathData} L 100,100 L 0,100 Z`}
            fill={`url(#gradient-${trend})`}
            strokeWidth="0"
          />
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={config.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Dots at data points */}
          {points.map((point, index) => {
            const [x, y] = point.split(',').map(Number)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={config.stroke}
                className={index === points.length - 1 ? 'animate-pulse' : ''}
              />
            )
          })}
        </svg>
      </div>

      {/* Trend indicator */}
      <div className="flex items-center">
        <TrendIcon className={`w-3 h-3 ${config.iconColor}`} />
      </div>
    </div>
  )
}

// Simple sparkline version for tight spaces
export function Sparkline({ 
  data, 
  color = '#6b7280',
  className = '',
  width = 60,
  height = 20 
}: {
  data: number[]
  color?: string
  className?: string
  width?: number
  height?: number
}) {
  if (!data || data.length === 0) {
    return null
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  })

  const pathData = `M ${points.join(' L ')}`

  return (
    <svg 
      width={width} 
      height={height}
      className={`inline-block ${className}`}
    >
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
} 