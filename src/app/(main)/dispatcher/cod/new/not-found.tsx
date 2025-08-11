import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy đơn hàng
          </h1>
          
          <p className="text-gray-600 mb-6">
            Đơn hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            Vui lòng kiểm tra lại ID đơn hàng hoặc quay lại danh sách container.
          </p>
          
          <div className="space-y-3">
            <Link href="/dispatcher/containers">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách container
              </Button>
            </Link>
            
            <Link href="/dispatcher">
              <Button variant="outline" className="w-full">
                Về trang chủ Dispatcher
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}