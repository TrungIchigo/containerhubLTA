'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Search, Filter, MoreHorizontal, CheckCircle, XCircle, Clock, MessageSquare, AlertCircle, Eye, FileCheck, FileMinus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { formatDateTimeVN } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'
import CodApprovalDialog from '@/components/features/cod/CodApprovalDialog'
import CodApprovalWithFeeDialog from '@/components/features/cod/CodApprovalWithFeeDialog'
import CodRequestMoreInfoDialog from '@/components/features/cod/CodRequestMoreInfoDialog'
import Pagination from '@/components/common/Pagination'
import type { CodRequestWithDetails } from '@/lib/types'

export default function CarrierCodRequestsTable() {
  const [requests, setRequests] = useState<CodRequestWithDetails[]>([])
  const [filteredRequests, setFilteredRequests] = useState<CodRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<CodRequestWithDetails | null>(null)
  const [dialogType, setDialogType] = useState<'approve' | 'approve-fee' | 'request-info' | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'expires_at'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const { toast } = useToast()
  const { canApproveRequests } = usePermissions()

  // Memoize permissions result để tránh re-calculation
  const hasApprovalPermission = canApproveRequests()

  // Load COD requests via API route
  const loadRequests = async (retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Loading carrier COD requests via API...')
      
      const response = await fetch('/api/cod/carrier-requests', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json()
          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`)
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'API returned unsuccessful response')
      }
      
      console.log('✅ COD requests loaded:', result.data?.length || 0, 'requests')
      setRequests(result.data || [])
      setError(null)
    } catch (error: any) {
      console.error('❌ Error loading COD requests:', error)
      const errorMessage = error?.message || 'Unknown error'
      
      // Retry once on network errors
      if (retryCount === 0 && (
        errorMessage.includes('fetch') || 
        errorMessage.includes('network') || 
        errorMessage.includes('Failed to fetch')
      )) {
        console.log('🔄 Retrying request...')
        return loadRequests(1)
      }
      
      setError(errorMessage)
      
      toast({
        title: "❌ Lỗi",
        description: `Không thể tải danh sách yêu cầu COD: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...requests]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.import_container?.container_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requesting_org?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason_for_request?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (!aValue && !bValue) return 0
      if (!aValue) return 1
      if (!bValue) return -1
      
      const comparison = new Date(aValue).getTime() - new Date(bValue).getTime()
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredRequests(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [requests, searchTerm, statusFilter, sortBy, sortOrder])

  // Paginated data
  const totalPages = Math.ceil(filteredRequests.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize)

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
      'PENDING': { text: 'Chờ duyệt', variant: 'pending' as const, icon: Clock },
      'APPROVED': { text: 'Đã duyệt', variant: 'approved' as const, icon: CheckCircle },
      'DECLINED': { text: 'Đã từ chối', variant: 'declined' as const, icon: XCircle },
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

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setSortBy('created_at')
    setSortOrder('desc')
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

  if (error) {
    return (
      <Card className="card">
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Không thể tải dữ liệu
            </h3>
            <p className="text-text-secondary mb-4">
              {error}
            </p>
            <Button onClick={() => loadRequests()} variant="outline">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-h3 text-text-primary flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Yêu Cầu Đổi Nơi Trả (COD)
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm container, công ty, lý do..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                  <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                  <SelectItem value="DECLINED">Đã từ chối</SelectItem>
                  <SelectItem value="AWAITING_INFO">Chờ bổ sung</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <Select value={sortBy} onValueChange={(value: 'created_at' | 'expires_at') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Ngày tạo</SelectItem>
                  <SelectItem value="expires_at">Hạn xử lý</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Thứ tự" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mới nhất</SelectItem>
                  <SelectItem value="asc">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <div>
              Hiển thị {startIndex + 1}-{Math.min(startIndex + pageSize, filteredRequests.length)} 
              trong tổng số {filteredRequests.length} yêu cầu
              {requests.length !== filteredRequests.length && ` (lọc từ ${requests.length} yêu cầu)`}
            </div>
            <div className="flex items-center gap-4">
              <span>Chờ duyệt: {requests.filter(r => r.status === 'PENDING').length}</span>
              <span>Chờ bổ sung: {requests.filter(r => r.status === 'AWAITING_INFO').length}</span>
            </div>
          </div>

          {/* Table */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-body">
                {requests.length === 0 
                  ? 'Chưa có yêu cầu COD nào.' 
                  : 'Không tìm thấy yêu cầu nào với bộ lọc hiện tại.'
                }
              </p>
              <p className="text-body-small mt-2">
                {requests.length === 0 
                  ? 'Các yêu cầu mới sẽ xuất hiện tại đây.' 
                  : 'Hãy thử điều chỉnh bộ lọc để xem thêm kết quả.'
                }
              </p>
            </div>
          ) : (
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
                  {paginatedRequests.map((request) => (
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
                            {typeof request.import_container?.container_type === 'object' && 
                             request.import_container?.container_type && 
                             'code' in request.import_container.container_type
                              ? (request.import_container.container_type as any).code
                              : request.import_container?.container_type
                            }
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
                          {request.status === 'PENDING' || request.status === 'AWAITING_INFO' ? (
                            <span className="text-orange-600 font-medium">
                              {getTimeRemaining(request.expires_at)}
                            </span>
                          ) : (
                            <span className="text-text-secondary">-</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="table-cell text-center">
                        {hasApprovalPermission && (request.status === 'PENDING' || request.status === 'AWAITING_INFO') ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleAction(request, 'approve')}
                                className="flex items-center gap-2 text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Phê Duyệt Không Phí
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAction(request, 'approve-fee')}
                                className="flex items-center gap-2 text-blue-600"
                              >
                                <FileCheck className="h-4 w-4" />
                                Phê Duyệt Với Phí
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAction(request, 'request-info')}
                                className="flex items-center gap-2 text-orange-600"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Yêu Cầu Bổ Sung
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled>
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalCount={filteredRequests.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
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