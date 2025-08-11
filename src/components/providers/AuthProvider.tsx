'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useEDepotAuth, type UseEDepotAuthReturn } from '@/hooks/useEDepotAuth'

// Create the auth context
const AuthContext = createContext<UseEDepotAuthReturn | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useEDepotAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use the auth context
export function useAuth(): UseEDepotAuthReturn {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthProvider