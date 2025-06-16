'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, AlertTriangle, CheckCircle } from 'lucide-react'
import { useCargoTypes } from '@/hooks/useCargoTypes'

export default function CargoTypesManagement() {
  const { cargoTypes, loading, error } = useCargoTypes()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Quản Lý Loại Hàng Hóa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Lỗi Tải Dữ Liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Quản Lý Loại Hàng Hóa
          <Badge variant="secondary" className="ml-2">
            {cargoTypes.length} loại
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Danh sách các loại hàng hóa chuẩn hóa trong hệ thống. Việc thêm/sửa đổi chỉ có thể thực hiện bởi Platform Admin.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cargoTypes.map((cargoType) => (
            <div 
              key={cargoType.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {cargoType.requires_special_handling ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary">
                      {cargoType.name}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {cargoType.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {cargoType.requires_special_handling ? (
                  <Badge variant="destructive" className="text-xs">
                    Xử lý đặc biệt
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs">
                    Tiêu chuẩn
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {cargoTypes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có loại hàng hóa nào được định nghĩa</p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <h4 className="font-semibold mb-1">Lưu ý quan trọng:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Loại hàng hóa ảnh hưởng trực tiếp đến khả năng ghép lệnh container</li>
                <li>Container chở hàng nguy hiểm không thể ngay lập tức chở thực phẩm</li>
                <li>Chỉ Platform Admin mới có thể thay đổi danh mục này</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 