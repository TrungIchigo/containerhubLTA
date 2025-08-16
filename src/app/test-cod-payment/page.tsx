'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CodPaymentDialog } from '@/components/features/cod/CodPaymentDialog'
import type { PendingCodPayment } from '@/lib/types/billing'

/**
 * Test page for CodPaymentDialog component to verify eDepot wallet data loading and display
 */
export default function TestCodPaymentPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Mock COD payment data for testing
  const mockPayment: PendingCodPayment = {
    requesting_org_name: 'eDepot Test Org',
    created_at: new Date().toISOString() + 'Z',
    id: 'test-payment-001',
    container_number: 'TCLU1234567',
    cod_fee: 150000, // 150,000 VNĐ
    delivery_confirmed_at: new Date().toISOString() + 'Z',
    original_depot_address: 'Depot A - 123 Test Street, Ho Chi Minh City',
    requested_depot_name: 'Depot B - 456 Another Street, Ho Chi Minh City',
    status: 'PENDING_PAYMENT' as const
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test COD Payment Dialog
          </h1>
          <p className="text-gray-600">
            Test page để kiểm tra việc load và hiển thị dữ liệu eDepot wallet
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Mock Payment Data</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Container:</span>
              <p className="text-gray-600">{mockPayment.container_number}</p>
            </div>
            <div>
              <span className="font-medium">COD Fee:</span>
              <p className="text-gray-600">{mockPayment.cod_fee.toLocaleString('vi-VN')} VNĐ</p>
            </div>
            <div>
              <span className="font-medium">From:</span>
              <p className="text-gray-600">{mockPayment.original_depot_address}</p>
            </div>
            <div>
              <span className="font-medium">To:</span>
              <p className="text-gray-600">{mockPayment.requested_depot_name}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => setDialogOpen(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Mở COD Payment Dialog
          </Button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Hướng dẫn test:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Nhấn nút "Mở COD Payment Dialog" ở trên</li>
            <li>Chuyển sang tab "Quỹ i-Prepaid@LTA"</li>
            <li>Kiểm tra console logs để xem dữ liệu eDepot có được load không</li>
            <li>Xem thông tin Mã quỹ và Số dư có hiển thị đúng không</li>
          </ol>
        </div>
      </div>

      <CodPaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={mockPayment}
        onPaymentSuccess={() => {
          console.log('✅ Payment success callback triggered')
          setDialogOpen(false)
        }}
      />
    </div>
  )
}