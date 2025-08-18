'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, MessageSquare, MapPin, Clock, CheckCircle, XCircle, AlertCircle, FileText, CreditCard, DollarSign } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SubmitInfoDialog from './SubmitInfoDialog'
import { CodPaymentDialog } from './CodPaymentDialog'
import { cancelCodRequest } from '@/lib/actions/cod'
import { useToast } from '@/hooks/use-toast'
import { formatDateTimeVN } from '@/lib/utils'
import type { CodRequestWithDetails } from '@/lib/types'
import type { PendingCodPayment } from '@/lib/types/billing'

interface CodRequestsTableProps {
  requests: CodRequestWithDetails[]
}

export default function CodRequestsTable({ requests }: CodRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<CodRequestWithDetails | null>(null)
  const [showSubmitInfoDialog, setShowSubmitInfoDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PendingCodPayment | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()



  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { text: 'Chờ duyệt Thay Đổi Địa Điểm', variant: 'pending-cod' as const, icon: Clock },
      'APPROVED': { text: 'Đang thực hiện Thay Đổi Địa Điểm', variant: 'processing-cod' as const, icon: CheckCircle },
      'DECLINED': { text: 'Bị từ chối Thay Đổi Địa Điểm', variant: 'declined-cod' as const, icon: XCircle },
      'AWAITING_INFO': { text: 'Chờ bổ sung', variant: 'warning' as const, icon: AlertCircle },
      'EXPIRED': { text: 'Hết hạn', variant: 'declined-cod' as const, icon: Clock },
      'REVERSED': { text: 'Đã hủy', variant: 'declined-cod' as const, icon: XCircle },
      'PENDING_PAYMENT': { text: 'Chờ thanh toán phí Thay Đổi Địa Điểm', variant: 'pending-cod-payment' as const, icon: DollarSign },
      'PAID': { text: 'Đã thanh toán', variant: 'processing-cod' as const, icon: CheckCircle },
      'PROCESSING_AT_DEPOT': { text: 'Đang xử lý tại Depot', variant: 'processing-depot' as const, icon: Clock },
      'COMPLETED': { text: 'Hoàn tất', variant: 'completed' as const, icon: CheckCircle },
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
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu Thay Đổi Địa Điểm này?')) {
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

  const handlePayment = (request: CodRequestWithDetails) => {
    // Convert COD request to payment format
    const payment: PendingCodPayment = {
      id: request.id,
      status: request.status,
      cod_fee: request.cod_fee || 0,
      delivery_confirmed_at: request.delivery_confirmed_at || new Date().toISOString(),
      container_number: request.import_container?.container_number || 'N/A',
      requesting_org_name: request.requesting_org?.name || 'N/A',
      original_depot_address: request.original_depot_address,
      requested_depot_name: request.requested_depot?.name || 'N/A',
      created_at: request.created_at
    }
    
    setSelectedPayment(payment)
    setPaymentDialogOpen(true)
  }

  const handlePaymentSuccess = () => {
    // Reload page to refresh data
    window.location.reload()
  }

  return (
    <>
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-h3 text-text-primary flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Yêu Cầu Thay Đổi Địa Điểm Giao Trả
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-body">Chưa có yêu cầu thay đổi địa điểm nào.</p>
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
                    <th className="table-header">Phí thay đổi địa điểm (VNĐ)</th>
                    <th className="table-header text-center w-32">Trạng thái</th>
                    <th className="table-header text-center w-24">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="table-row">
                      <td className="table-cell">
                        <div className="space-y-1">
                          <div className="text-xs text-text-secondary">
                            {request.import_container?.container_number}
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
                              {request.cod_fee.toLocaleString('vi-VN')}
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
                        {request.status === 'PENDING_PAYMENT' && request.cod_fee && request.cod_fee > 0 ? (
                          // Payment button for pending payments
                          <Button
                            size="sm"
                            onClick={() => handlePayment(request)}
                            className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white"
                          >
                            <CreditCard className="mr-1 h-3 w-3" />
                            Thanh toán
                          </Button>
                        ) : request.status === 'PENDING' || request.status === 'AWAITING_INFO' ? (
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

      {/* COD Payment Dialog */}
      <CodPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        payment={selectedPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  )
}