'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DispatcherRealtimeUpdater } from './DispatcherRealtimeUpdater'
import { Toaster } from '@/components/ui/toaster'
import AddImportContainerForm from '@/components/dispatcher/AddImportContainerForm'
import AddExportBookingForm from '@/components/dispatcher/AddExportBookingForm'
import FloatingActionMenu from '@/components/dispatcher/FloatingActionMenu'

interface DispatcherDashboardWrapperProps {
  userOrgId?: string
  children: React.ReactNode
  shippingLines?: any[]
  kpis?: {
    availableContainers: number
    availableBookings: number
    approvedStreetTurns: number
  }
}

export function DispatcherDashboardWrapper({ userOrgId, children, shippingLines = [], kpis }: DispatcherDashboardWrapperProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  useEffect(() => {
    const action = searchParams?.get('action')
    if (action === 'add-import') {
      setShowImportDialog(true)
    } else if (action === 'add-export') {
      setShowExportDialog(true)
    }
  }, [searchParams])

  const handleImportDialogChange = (open: boolean) => {
    setShowImportDialog(open)
    if (!open) {
      // Clear the action parameter from URL
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.delete('action')
      const newUrl = params.toString() ? `/dispatcher?${params.toString()}` : '/dispatcher'
      router.replace(newUrl)
    }
  }

  const handleExportDialogChange = (open: boolean) => {
    setShowExportDialog(open)
    if (!open) {
      // Clear the action parameter from URL
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.delete('action')
      const newUrl = params.toString() ? `/dispatcher?${params.toString()}` : '/dispatcher'
      router.replace(newUrl)
    }
  }

  const updateUrlParams = (action: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (action) {
      params.set('action', action)
    } else {
      params.delete('action')
    }
    const newUrl = params.toString() ? `/dispatcher?${params.toString()}` : '/dispatcher'
    router.replace(newUrl)
  }

  return (
    <>
      {/* Real-time updates listener */}
      {userOrgId && <DispatcherRealtimeUpdater userOrgId={userOrgId} />}
      
      {/* Main content */}
      {children}
      
      {/* Floating Action Menu */}
      {/* <FloatingActionMenu
        onAddImport={() => setShowImportDialog(true)}
        onAddExport={() => setShowExportDialog(true)}
      /> */}
      
      {/* Action Dialogs */}
      <AddImportContainerForm 
        shippingLines={shippingLines}
        isOpen={showImportDialog}
        onOpenChange={(open) => {
          setShowImportDialog(open)
          updateUrlParams(open ? 'add-import' : null)
        }}
      />
      
      <AddExportBookingForm 
        shippingLines={shippingLines}
        isOpen={showExportDialog}
        onOpenChange={(open) => {
          setShowExportDialog(open)
          updateUrlParams(open ? 'add-export' : null)
        }}
      />

      <Toaster />
    </>
  )
}