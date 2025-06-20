'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, MessageSquare, MapPin, Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SubmitInfoDialog from './SubmitInfoDialog'
import { cancelCodRequest } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import { formatDateTimeVN } from '@/lib/utils'
import type { CodRequestWithDetails } from '@/lib/types'

interface CodRequestsTableProps {
  requests: CodRequestWithDetails[]
}

export default function CodRequestsTable({ requests }: CodRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<CodRequestWithDetails | null>(null)
  const [showSubmitInfoDialog, setShowSubmitInfoDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()



  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { text: 'Chờ duyệt', variant: 'pending' as const, icon: Clock },
      'APPROVED': { text: 'Đã duyệt', variant: 'approved' as const, icon: CheckCircle },
      'DECLINED': { text: 'Đã từ chối', variant: 'declined' as const, icon: XCircle },
      'AWAITING_INFO': { text: 'Chờ bổ sung', variant: 'warning' as const, icon: AlertCircle },
      'EXPIRED': { text: 'Hết hạn', variant: 'declined' as const, icon: Clock },
      'REVERSED': { text: 'Đã hủy', variant: 'declined' as const, icon: XCircle },
    }
    
    const currentStatus = statusMap[status as keyof typeof statusMap] || { 
      text: status, 
      variant: 'outline' as const, 
      icon: Clock 
    }
    
    const IconComponent = currentStatus.icon
    
    return (
      <Badge variant={currentStatus.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {currentStatus.text}
      </Badge>
    )
  }

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()
    
    if (diffMs <= 0) return 'Đã hết hạn'
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu COD này?')) {
      return
    }

    setIsLoading(true)
    try {
      const result = await cancelCodRequest(requestId)
      
      if (result.success) {
        toast({
          title: "✅ Thành công",
          description: result.message,
          variant: "success"
        })
        // Reload page to refresh data
        window.location.reload()
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error cancelling COD request:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi hủy yêu cầu',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitInfo = (request: CodRequestWithDetails) => {
    setSelectedRequest(request)
    setShowSubmitInfoDialog(true)
  }

  const handleDialogClose = () => {
    setSelectedRequest(null)
    setShowSubmitInfoDialog(false)
    // Reload page to refresh data
    window.location.reload()
  }

  return (
    <>
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-h3 text-text-primary flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Yêu Cầu Đổi Nơi Trả (COD)
          </CardTitle>
          <p className="text-body-small text-text-secondary">
            Tổng cộng: {requests.length} yêu cầu • 
            Chờ duyệt: {requests.filter(r => r.status === 'PENDING').length} • 
            Chờ bổ sung: {requests.filter(r => r.status === 'AWAITING_INFO').length}
          </p>
        </CardHeader>
        
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-body">Chưa có yêu cầu COD nào.</p>
              <p className="text-body-small mt-2">Các yêu cầu thay đổi nơi trả container sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header">Container</th>
                    <th className="table-header">Hãng tàu</th>
                    <th className="table-header">Nơi trả gốc</th>
                    <th className="table-header">Nơi trả mới</th>
                    <th className="table-header">Ngày gửi</th>
                    <th className="table-header">Hết hạn</th>
                    <th className="table-header">Phí COD</th>
                    <th className="table-header text-center w-32">Trạng thái</th>
                    <th className="table-header text-center w-24">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="table-row">
                      <td className="table-cell">
                        <div className="space-y-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {request.import_container?.container_number}
                          </Badge>
                          <div className="text-xs text-text-secondary">
                            {request.import_container?.container_type}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-text-primary">
                          {request.approving_org?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-text-secondary max-w-[200px] truncate">
                          {request.original_depot_address}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-text-secondary max-w-[200px] truncate">
                          {request.requested_depot?.name}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {request.requested_depot?.address}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm">
                          {formatDateTimeVN(request.created_at)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm">
                          {request.status === 'PENDING' || request.status === 'AWAITING_INFO' ? (
                            <span className="text-orange-600 font-medium">
                              {getTimeRemaining(request.expires_at)}
                            </span>
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm">
                          {request.cod_fee ? (
                            <span className="font-medium text-blue-600">
                              {request.cod_fee.toLocaleString('vi-VN')} VNĐ
                            </span>
                          ) : (
                            <span className="text-text-secondary">Miễn phí</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-center w-32">
                        <div className="whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </div>
                      </td>
                      <td className="table-cell text-center w-24">
                        {request.status === 'PENDING' || request.status === 'AWAITING_INFO' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {request.status === 'AWAITING_INFO' && (
                                <DropdownMenuItem
                                  onClick={() => handleSubmitInfo(request)}
                                  className="cursor-pointer text-blue-600"
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Cập nhật Yêu cầu
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleCancelRequest(request.id)}
                                className="cursor-pointer text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Hủy yêu cầu
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

      {/* Submit Info Dialog */}
      {selectedRequest && showSubmitInfoDialog && (
        <SubmitInfoDialog
          isOpen={showSubmitInfoDialog}
          onClose={handleDialogClose}
          request={selectedRequest}
        />
      )}
    </>
  )
} 