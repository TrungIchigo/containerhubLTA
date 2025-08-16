'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/use-user'
import { CodPaymentDialog } from '@/components/features/cod/CodPaymentDialog'
import { TopUpDialog } from '@/components/features/cod/TopUpDialog'
import { RefreshCw, User, Wallet, TestTube } from 'lucide-react'
import type { PendingCodPayment } from '@/lib/types/billing'

// Mock COD payment data for testing
const mockPayment: PendingCodPayment = {
  id: 'test-payment-001',
  codRequestId: 'COD-TEST-001',
  amount: 150000,
  currency: 'VND',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  delivery_confirmed_at: new Date().toISOString(),
  original_depot_address: '123 Test Street, District 1, Ho Chi Minh City',
  requested_depot_name: 'Test Depot Location',
  container_number: 'TEST1234567',
  route_description: 'Test Route: From Test Origin to Test Destination'
}

export default function TestFundReloadPage() {
  const { user, signOut } = useUser()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false)
  const [testLog, setTestLog] = useState<string[]>([])
  const [simulatedUserId, setSimulatedUserId] = useState<string | null>(null)

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN')
    setTestLog(prev => [...prev, `[${timestamp}] ${message}`])
  }

  useEffect(() => {
    if (user) {
      addToLog(`✅ User logged in: ${user.email} (ID: ${user.id})`)
      setSimulatedUserId(user.id)
    } else {
      addToLog('❌ No user logged in')
      setSimulatedUserId(null)
    }
  }, [user])

  const handleSignOut = async () => {
    addToLog('🔄 Signing out current user...')
    await signOut()
    addToLog('✅ User signed out successfully')
  }

  const openPaymentDialog = () => {
    addToLog('🔓 Opening COD Payment Dialog')
    setPaymentDialogOpen(true)
  }

  const openTopUpDialog = () => {
    addToLog('🔓 Opening Top Up Dialog')
    setTopUpDialogOpen(true)
  }

  const clearLog = () => {
    setTestLog([])
  }

  const simulateUserChange = () => {
    const newUserId = `simulated-user-${Date.now()}`
    addToLog(`🔄 Simulating user change to ID: ${newUserId}`)
    setSimulatedUserId(newUserId)
    // This would trigger the useEffect in the dialogs if they were tracking this simulated ID
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-600" />
          Test Fund Data Reload
        </h1>
        <p className="text-muted-foreground">
          Test page để verify fund data được reload đúng cách khi user thay đổi
        </p>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Email</Badge>
                <span className="font-mono text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">User ID</Badge>
                <span className="font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Status</Badge>
                <Badge variant="default">Logged In</Badge>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Badge variant="secondary">No User Logged In</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Please log in to test fund data loading
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Test Controls
          </CardTitle>
          <CardDescription>
            Use these buttons to test fund data loading and user switching behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              onClick={openPaymentDialog}
              disabled={!user}
              className="w-full"
            >
              Open Payment Dialog
            </Button>
            <Button 
              onClick={openTopUpDialog}
              disabled={!user}
              variant="outline"
              className="w-full"
            >
              Open TopUp Dialog
            </Button>
            <Button 
              onClick={simulateUserChange}
              disabled={!user}
              variant="secondary"
              className="w-full"
            >
              Simulate User Change
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Test Log
          </CardTitle>
          <Button onClick={clearLog} variant="ghost" size="sm">
            Clear Log
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
            {testLog.length === 0 ? (
              <p className="text-muted-foreground text-sm">No log entries yet...</p>
            ) : (
              <div className="space-y-1">
                {testLog.map((entry, index) => (
                  <div key={index} className="font-mono text-xs text-gray-700 dark:text-gray-300">
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">Để test fund data reload:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Đảm bảo bạn đã đăng nhập (thấy user info ở trên)</li>
              <li>Mở Payment Dialog hoặc TopUp Dialog</li>
              <li>Kiểm tra fund data được load (xem console logs)</li>
              <li>Đóng dialog</li>
              <li>Click "Simulate User Change" để simulate việc đổi user</li>
              <li>Mở lại dialog và kiểm tra:</li>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Console logs hiển thị "User changed, clearing fund data state"</li>
                <li>Console logs hiển thị "reloading fund data for new user" nếu dialog đang mở</li>
                <li>Fund data được reload cho user mới</li>
              </ul>
            </ol>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">Expected Behavior:</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Khi user thay đổi, tất cả fund data (prepaid fund, eDepot wallet) phải được clear và reload. 
              Không được hiển thị data cũ của user trước đó.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CodPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        payment={mockPayment}
        onPaymentSuccess={() => {
          addToLog('✅ Payment completed successfully')
          setPaymentDialogOpen(false)
        }}
      />

      <TopUpDialog
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
        onTopUpSuccess={() => {
          addToLog('✅ Top up completed successfully')
          setTopUpDialogOpen(false)
        }}
      />
    </div>
  )
}