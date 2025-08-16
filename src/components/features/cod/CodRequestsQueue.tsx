'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, CheckCircle, DollarSign, MessageSquare, Clock, XCircle, AlertCircle, Eye, FileCheck, FileMinus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// import { getCarrierCodRequests } from '@/lib/actions/cod' // Moved to API route
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import CodApprovalDialog from './CodApprovalDialog'
import CodApprovalWithFeeDialog from './CodApprovalWithFeeDialog'
import CodRequestMoreInfoDialog from './CodRequestMoreInfoDialog'
import { formatDateTimeVN } from '@/lib/utils'
import type { CodRequestWithDetails } from '@/lib/types'

export default function CodRequestsQueue() {
  const [requests, setRequests] = useState<CodRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<CodRequestWithDetails | null>(null)
  const [dialogType, setDialogType] = useState<'approve' | 'approve-fee' | 'request-info' | null>(null)
  const { toast } = useToast()
  const { canApproveRequests } = usePermissions()

  // Load COD requests via API route
  const loadRequests = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading carrier COD requests via API...')
      
      const response = await fetch('/api/cod/carrier-requests', {
        method: 'GET',
        credentials: 'include', // Include cookies for auth
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch COD requests')
      }
      
      console.log('✅ COD requests loaded:', result.data.length, 'requests')
      setRequests(result.data)
    } catch (error: any) {
      console.error('❌ Error loading COD requests:', error)
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })
      toast({
        title: "❌ Lỗi",
        description: `Không thể tải danh sách yêu cầu COD: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleAction = (request: CodRequestWithDetails, action: 'approve' | 'approve-fee' | 'request-info') => {
    setSelectedRequest(request)
    setDialogType(action)
  }

  const handleDialogClose = () => {
    setSelectedRequest(null)
    setDialogType(null)
    // Reload requests after action
    loadRequests()
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { text: 'Chờ duyệt COD', variant: 'pending-cod' as const, icon: Clock },
      'APPROVED': { text: 'Đang thực hiện COD', variant: 'processing-cod' as const, icon: CheckCircle },
      'DECLINED': { text: 'Bị từ chối COD', variant: 'declined-cod' as const, icon: XCircle },
      'AWAITING_INFO': { text: 'Chờ bổ sung', variant: 'warning' as const, icon: MessageSquare },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Đang tải yêu cầu COD...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {requests.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-body">Chưa có yêu cầu COD nào.</p>
          <p className="text-body-small mt-2">Các yêu cầu mới sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-body-small text-text-secondary mb-4">
            Tổng cộng: {requests.length} yêu cầu • 
            Chờ duyệt: {requests.filter(r => r.status === 'PENDING').length}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Công ty Yêu cầu</th>
                  <th className="table-header">Container</th>
                  <th className="table-header">Nơi trả gốc</th>
                  <th className="table-header">Nơi trả mới</th>
                  <th className="table-header">Phí COD</th>
                  <th className="table-header">Lý do</th>
                  <th className="table-header">Ngày gửi</th>
                  <th className="table-header">Hết hạn</th>
                  <th className="table-header text-center w-32">Trạng thái</th>
                  <th className="table-header text-center w-24">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="table-row">
                    <td className="table-cell">
                      <div className="font-medium text-text-primary">
                        {request.requesting_org?.name || 'N/A'}
                      </div>
                    </td>
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
                        {request.cod_fee ? (
                          <span className="font-medium text-blue-600">
                            {request.cod_fee.toLocaleString('vi-VN')} VNĐ
                          </span>
                        ) : (
                          <span className="text-text-secondary">Miễn phí</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-text-secondary max-w-[150px] truncate">
                        {request.reason_for_request || '-'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        {formatDateTimeVN(request.created_at)}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        {request.status === 'PENDING' ? (
                          <span className="text-orange-600 font-medium">
                            {getTimeRemaining(request.expires_at)}
                          </span>
                        ) : (
                          <span className="text-text-secondary">-</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-center w-32">
                      <div className="whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </div>
                    </td>
                    <td className="table-cell text-center w-24">
                      {request.status === 'PENDING' && canApproveRequests() ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Mở menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleAction(request, 'approve')}
                              className="cursor-pointer text-green-600 hover:text-primary hover:bg-primary/10"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Phê duyệt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction(request, 'approve-fee')}
                              className="cursor-pointer text-blue-600 hover:text-primary hover:bg-primary/10"
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Phê duyệt (kèm phí)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction(request, 'request-info')}
                              className="cursor-pointer text-orange-600 hover:text-primary hover:bg-primary/10"
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Yêu cầu Bổ sung
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
        </div>
      )}

      {/* Dialogs */}
      {selectedRequest && dialogType === 'approve' && (
        <CodApprovalDialog
          isOpen={true}
          onClose={handleDialogClose}
          request={selectedRequest}
        />
      )}

      {selectedRequest && dialogType === 'approve-fee' && (
        <CodApprovalWithFeeDialog
          isOpen={true}
          onClose={handleDialogClose}
          request={selectedRequest}
        />
      )}

      {selectedRequest && dialogType === 'request-info' && (
        <CodRequestMoreInfoDialog
          isOpen={true}
          onClose={handleDialogClose}
          request={selectedRequest}
        />
      )}
    </>
  )
}