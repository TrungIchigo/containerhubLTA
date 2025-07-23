/**
 * Generate a random string ID that's safe for SSR/hydration
 * Uses crypto.randomUUID if available, falls back to Math.random
 */
export function generateId(prefix = 'id'): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`
  }
  
  // Fallback for server-side or older browsers
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a temporary ID for client-side operations
 * Always uses Math.random for consistency
 */
export function generateTempId(prefix = 'temp'): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a timestamp-based ID that's consistent
 * Uses Date.now() but with fallback for SSR
 */
export function generateTimestampId(prefix = 'ts'): string {
  const timestamp = typeof window !== 'undefined' ? Date.now() : 0
  const random = Math.random().toString(36).substr(2, 5)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Generate a counter-based ID for components
 * Safe for SSR as it uses a static counter
 */
let counter = 0
export function generateCounterId(prefix = 'cmp'): string {
  return `${prefix}_${++counter}`
} 