'use client'

import { DispatcherRealtimeUpdater } from './DispatcherRealtimeUpdater'
import { Toaster } from '@/components/ui/toaster'

interface DispatcherDashboardWrapperProps {
  userOrgId: string
  children: React.ReactNode
}

export function DispatcherDashboardWrapper({ userOrgId, children }: DispatcherDashboardWrapperProps) {
  return (
    <>
      {/* Real-time updates listener */}
      <DispatcherRealtimeUpdater userOrgId={userOrgId} />
      
      {/* Main content */}
      {children}
      
      {/* Toast notifications */}
      <Toaster />
    </>
  )
} 