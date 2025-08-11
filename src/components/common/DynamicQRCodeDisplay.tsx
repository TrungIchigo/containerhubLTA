'use client'

import dynamic from 'next/dynamic'
import { QrCode } from 'lucide-react'

interface QRCodeDisplayProps {
  value: string
  size?: number
  title?: string
  description?: string
  bankInfo?: {
    bankName: string
    accountNumber: string
    accountName: string
    amount: number
    transferContent: string
  }
  className?: string
}

const QRCodeDisplay = dynamic(() => import('./QRCodeDisplay').then(mod => ({ default: mod.QRCodeDisplay })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-gray-600">Đang tải mã QR...</p>
      </div>
    </div>
  )
})

export default function DynamicQRCodeDisplay(props: QRCodeDisplayProps) {
  return <QRCodeDisplay {...props} />
}

export { DynamicQRCodeDisplay }