'use client'

import { ReactNode } from 'react'
import { useIsClient } from '@/hooks/use-hydration'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Component wrapper để tránh SSR cho dynamic content
 * Chỉ render children sau khi client hydration hoàn tất
 */
export default function NoSSR({ children, fallback = null }: NoSSRProps) {
  const isClient = useIsClient()

  if (!isClient) {
    return fallback
  }

  return <>{children}</>
}

/**
 * Higher Order Component để wrap component với NoSSR
 */
export function withNoSSR<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function NoSSRComponent(props: P) {
    return (
      <NoSSR fallback={fallback}>
        <Component {...props} />
      </NoSSR>
    )
  }
} 