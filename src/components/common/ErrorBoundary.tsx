'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  error: any
  title?: string
  showRetry?: boolean
  showGoHome?: boolean
}

export default function ErrorBoundary({ 
  error, 
  title = "Không thể tải dữ liệu",
  showRetry = true,
  showGoHome = true 
}: ErrorBoundaryProps) {
  // Determine error type and show appropriate message
  let errorMessage = 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.'
  let errorDetails = ''
  
  if (error.message?.includes('foreign key')) {
    errorMessage = 'Có lỗi về cấu trúc dữ liệu. Vui lòng liên hệ admin để khắc phục.'
    errorDetails = 'Lỗi: Foreign key constraint violation'
  } else if (error.message?.includes('organization not found')) {
    errorMessage = 'Không tìm thấy thông tin tổ chức. Vui lòng liên hệ admin.'
    errorDetails = 'Lỗi: User organization not found'
  } else if (error.message?.includes('Unauthorized')) {
    errorMessage = 'Bạn không có quyền truy cập vào trang này.'
    errorDetails = 'Lỗi: Unauthorized access'
  } else if (error.message?.includes('does not exist')) {
    errorMessage = 'Có lỗi về cấu trúc database. Vui lòng liên hệ admin để sửa schema.'
    errorDetails = `Lỗi: ${error.message}`
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              {title}
            </h3>
            <p className="text-red-700 mb-3">
              {errorMessage}
            </p>
            {errorDetails && (
              <p className="text-sm text-red-600 mb-4">
                Chi tiết: {errorDetails}
              </p>
            )}
            <div className="flex gap-3">
              {showRetry && (
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                >
                  Thử lại
                </Button>
              )}
              {showGoHome && (
                <Button 
                  onClick={handleGoHome}
                  variant="outline"
                  size="sm"
                >
                  Về trang chủ
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fallback Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Yêu cầu chờ duyệt</h4>
          <p className="text-3xl font-bold text-gray-400">--</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Đã duyệt tháng này</h4>
          <p className="text-3xl font-bold text-gray-400">--</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-2">Tổng đã duyệt</h4>
          <p className="text-3xl font-bold text-gray-400">--</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Yêu cầu tái sử dụng</h4>
        <p className="text-gray-500 text-center py-8">
          Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.
        </p>
      </div>
    </div>
  )
} 