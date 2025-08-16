'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/use-user'
import { CodPaymentDialog } from '@/components/features/cod/CodPaymentDialog'
import { User, RefreshCw, LogOut, LogIn } from 'lucide-react'
import type { PendingCodPayment } from '@/lib/types/billing'

// Mock COD payment data for testing
const mockCodPayment: PendingCodPayment = {
  id: 'test-payment-001',
  container_number: 'TESU1234567',
  cod_fee: 150000,
  delivery_confirmed_at: new Date().toISOString(),
  original_depot_address: 'Depot A - 123 Test Street, Ho Chi Minh City',
  requested_depot_name: 'Depot B - 456 Demo Avenue, Ho Chi Minh City',
  status: 'PENDING_PAYMENT',
  created_at: new Date().toISOString(),
  requesting_org_name: 'Org XYZ'  // Remove updated_at since it's not in PendingCodPayment type
}

export default function TestUserSwitchingPage() {
  const { user, loading, signOut } = useUser()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [testLog, setTestLog] = useState<string[]>([])

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN')
    setTestLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)])
  }

  const handleOpenPaymentDialog = () => {
    addToLog('🔓 Mở CodPaymentDialog - sẽ load fund data cho user hiện tại')
    setPaymentDialogOpen(true)
  }

  const handleSignOut = async () => {
    addToLog('🚪 Đăng xuất user hiện tại...')
    await signOut()
    addToLog('✅ Đã đăng xuất - fund data sẽ được clear')
  }

  const clearTestLog = () => {
    setTestLog([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500" />
          <p className="text-blue-600 mt-2">Đang tải thông tin user...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-blue-800">
              <User className="w-8 h-8" />
              Test User Switching & Fund Data Clearing
            </CardTitle>
            <CardDescription className="text-blue-600">
              Trang test để verify rằng fund data được clear khi user thay đổi account
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Current User Info */}
        <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">Thông Tin User Hiện Tại</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Đã đăng nhập
                  </Badge>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>User ID:</strong> {user.id}</p>
                  {user.profile && (
                    <>
                      <p><strong>Tên:</strong> {user.profile.full_name}</p>
                      <p><strong>Vai trò:</strong> {user.profile.role}</p>
                      <p><strong>Tổ chức:</strong> {user.profile.organization?.name || 'N/A'}</p>
                    </>
                  )}
                </div>
                <Button 
                  onClick={handleSignOut}
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Badge variant="secondary" className="mb-3">Chưa đăng nhập</Badge>
                <p className="text-gray-600 mb-4">Vui lòng đăng nhập để test functionality</p>
                <Button 
                  onClick={() => window.location.href = '/auth/login'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Đi đến trang đăng nhập
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Actions */}
        {user && (
          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-purple-800">Test Actions</CardTitle>
              <CardDescription>
                Các hành động để test việc clear fund data khi user thay đổi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={handleOpenPaymentDialog}
                  className="bg-blue-600 hover:bg-blue-700 h-12"
                >
                  🔓 Mở Payment Dialog
                </Button>
                <Button 
                  onClick={clearTestLog}
                  variant="outline"
                  className="h-12"
                >
                  🧹 Clear Test Log
                </Button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Hướng dẫn test:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Mở Payment Dialog để load fund data cho user hiện tại</li>
                  <li>Kiểm tra console logs để thấy fund data được load</li>
                  <li>Đăng xuất user hiện tại</li>
                  <li>Đăng nhập bằng account khác</li>
                  <li>Mở lại Payment Dialog và verify fund data đã được clear</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Log */}
        <Card className="border-gray-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Test Log</CardTitle>
            <CardDescription>
              Log các hành động và events để track việc clear fund data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg border max-h-64 overflow-y-auto">
              {testLog.length > 0 ? (
                <div className="space-y-1 font-mono text-sm">
                  {testLog.map((log, index) => (
                    <div key={index} className="text-gray-700">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Chưa có log nào...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mock Payment Data */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-orange-800">Mock Payment Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Container:</strong> {mockCodPayment.container_number}</p>
                  <p><strong>Phí COD:</strong> {mockCodPayment.cod_fee.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div>
                  <p><strong>Trạng thái:</strong> {mockCodPayment.status}</p>
                  <p><strong>ID:</strong> {mockCodPayment.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* COD Payment Dialog */}
      <CodPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        payment={mockCodPayment}
        onPaymentSuccess={() => {
          addToLog('✅ Payment thành công!')
          setPaymentDialogOpen(false)
        }}
      />
    </div>
  )
}