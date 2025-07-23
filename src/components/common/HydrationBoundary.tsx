'use client'

import { ReactNode, useState, useEffect } from 'react'

interface HydrationBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onHydrationError?: (error: Error) => void
}

/**
 * Component boundary để handle hydration issues gracefully
 * Catches hydration errors và render fallback UI
 */
export default function HydrationBoundary({ 
  children, 
  fallback = null,
  onHydrationError
}: HydrationBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Listen for hydration errors
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('hydration') || event.message?.includes('Hydration')) {
        setHasError(true)
        onHydrationError?.(new Error(event.message))
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [onHydrationError])

  // Show fallback during SSR or if hydration error occurred
  if (!isClient || hasError) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook để check hydration status
 */
export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Higher Order Component để wrap component với HydrationBoundary
 */
export function withHydrationBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function HydrationBoundaryComponent(props: P) {
    return (
      <HydrationBoundary fallback={fallback}>
        <Component {...props} />
      </HydrationBoundary>
    )
  }
} 