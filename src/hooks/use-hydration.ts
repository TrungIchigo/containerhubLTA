'use client'

import { useEffect, useState } from 'react'

/**
 * Hook để handle hydration mismatch
 * Chỉ render content phía client sau khi hydration hoàn tất
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook để handle mounted state (alternative cho useIsClient)
 * Dùng cho các component cần render khác nhau giữa server và client
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted
}

/**
 * Hook để safe render dynamic content
 * Trả về fallback content cho SSR và actual content cho CSR
 */
export function useSafeHydration<T>(clientValue: () => T, fallbackValue: T) {
  const [value, setValue] = useState<T>(fallbackValue)

  useEffect(() => {
    setValue(clientValue())
  }, [clientValue])

  return value
} 