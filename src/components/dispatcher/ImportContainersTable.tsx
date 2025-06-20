'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, MapPin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CodRequestDialog from '@/components/features/cod/CodRequestDialog'
import type { ImportContainer, Organization } from '@/lib/types'
import { useState } from 'react'
import { formatStoredDateTimeVN } from '@/lib/utils'

interface ImportContainersTableProps {
  containers: (ImportContainer & {
    shipping_line?: Organization
    container_type?: any // Can be string or object from joined data
  })[]
  shippingLines: Organization[]
}

export default function ImportContainersTable({ 
  containers, 
  shippingLines 
}: ImportContainersTableProps) {
  const [selectedContainer, setSelectedContainer] = useState<ImportContainer | null>(null)
  const [isCodDialogOpen, setIsCodDialogOpen] = useState(false)

  // Status mapping cho container
  const statusMap = {
    'AVAILABLE': { text: 'Sẵn sàng', variant: 'approved' as const },
    'AWAITING_APPROVAL': { text: 'Chờ duyệt', variant: 'pending' as const },
    'AWAITING_COD_APPROVAL': { text: 'Chờ duyệt COD', variant: 'pending' as const },
    'CONFIRMED': { text: 'Đã ghép', variant: 'info' as const },
  }

  const getStatusBadge = (status: string) => {
    const currentStatus = statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const }
    return <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
  }

  const handleCodRequest = (container: ImportContainer) => {
    setSelectedContainer(container)
    setIsCodDialogOpen(true)
  }

  return (
    <>
      <Card className="card mb-8">               
        <CardContent>
          {containers.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p className="text-body">Chưa có lệnh giao trả nào.</p>
              <p className="text-body-small mt-2">Hãy thêm lệnh đầu tiên để bắt đầu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-text-primary">Số Container</th>
                    <th className="text-left p-3 font-medium text-text-primary">Loại</th>
                    <th className="text-left p-3 font-medium text-text-primary">Hãng Tàu</th>
                    <th className="text-left p-3 font-medium text-text-primary">Địa Điểm Dỡ Hàng</th>
                    <th className="text-left p-3 font-medium text-text-primary">Thời Gian Rảnh</th>
                    <th className="text-center p-3 font-medium text-text-primary w-32">Trạng Thái</th>
                    <th className="text-center p-3 font-medium text-text-primary w-24">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((container) => (
                    <tr key={container.id} className="border-b border-border hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-text-primary">
                          {container.container_number}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {typeof container.container_type === 'object' 
                            ? container.container_type?.code || container.container_type?.name || 'N/A'
                            : container.container_type || 'N/A'
                          }
                        </Badge>
                      </td>
                      <td className="p-3 text-text-secondary">
                        {container.shipping_line?.name || 'N/A'}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {container.drop_off_location}
                      </td>
                      <td className="p-3 text-text-secondary">
                        {formatStoredDateTimeVN(container.available_from_datetime)}
                      </td>
                      <td className="p-3 text-center w-32">
                        <div className="whitespace-nowrap">
                          {getStatusBadge(container.status)}
                        </div>
                      </td>
                      <td className="p-3 text-center w-24">
                        {container.status === 'AVAILABLE' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleCodRequest(container)}
                                className="cursor-pointer"
                              >
                                <MapPin className="mr-2 h-4 w-4" />
                                Yêu cầu Đổi Nơi Trả
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-text-secondary text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* COD Request Dialog */}
      {selectedContainer && (
        <CodRequestDialog
          isOpen={isCodDialogOpen}
          onClose={() => {
            setIsCodDialogOpen(false)
            setSelectedContainer(null)
          }}
          container={selectedContainer}
        />
      )}
    </>
  )
} 