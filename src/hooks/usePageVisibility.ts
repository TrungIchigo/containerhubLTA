'use client'

import { useState, useEffect, useCallback } from 'react'

export interface UsePageVisibilityReturn {
  isVisible: boolean
  isHidden: boolean
  visibilityState: DocumentVisibilityState
  wasHidden: boolean
}

/**
 * Custom hook to handle page visibility changes
 * Helps prevent unnecessary reloads when switching browser tabs
 * 
 * @returns Object containing visibility state and utilities
 */
export function usePageVisibility(): UsePageVisibilityReturn {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.visibilityState === 'visible'
    }
    return true
  })
  
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => {
    if (typeof document !== 'undefined') {
      return document.visibilityState
    }
    return 'visible'
  })
  
  const [wasHidden, setWasHidden] = useState(false)

  const handleVisibilityChange = useCallback(() => {
    if (typeof document === 'undefined') return
    
    const currentState = document.visibilityState
    const currentlyVisible = currentState === 'visible'
    
    setVisibilityState(currentState)
    setIsVisible(currentlyVisible)
    
    // Track if page was previously hidden
    if (!currentlyVisible) {
      setWasHidden(true)
    }
    
    // Log visibility changes for debugging
    console.log('Page visibility changed:', {
      state: currentState,
      visible: currentlyVisible,
      timestamp: new Date().toISOString()
    })
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also listen to focus/blur events as fallback
    const handleFocus = () => {
      console.log('Window focused')
      setIsVisible(true)
    }
    
    const handleBlur = () => {
      console.log('Window blurred')
      setIsVisible(false)
      setWasHidden(true)
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [handleVisibilityChange])

  return {
    isVisible,
    isHidden: !isVisible,
    visibilityState,
    wasHidden
  }
}

export default usePageVisibility