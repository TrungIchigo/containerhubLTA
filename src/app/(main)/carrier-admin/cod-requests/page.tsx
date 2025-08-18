'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, MoreHorizontal, Eye, CheckCircle, XCircle } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/common/Pagination'
import { Badge } from '@/components/ui/badge'
import { formatStoredDateTimeVN } from '@/lib/utils'
import CodApprovalDialog from '@/components/features/cod/CodApprovalDialog'
import { useToast } from '@/hooks/use-toast'
import { handleCodDecision } from '@/lib/actions/cod'
import type { CodRequestWithDetails } from '@/lib/types'

interface CodRequest {
  id: string
  container_number: string
  booking_number: string
  original_location: string
  requested_location: string
  cod_fee: number
  status: string
  created_at: string
  requested_by_org?: { name: string }
}

// Helper function to convert CodRequest to CodRequestWithDetails for dialog compatibility
const convertToCodRequestWithDetails = (request: CodRequest): CodRequestWithDetails => {
  return {
    id: request.id,
    dropoff_order_id: request.booking_number,
    requesting_org_id: 'temp-org-id',
    approving_org_id: 'temp-approving-org-id', 
    original_depot_address: request.original_location,
    requested_depot_id: 'temp-depot-id',
    status: request.status as any,
    cod_fee: request.cod_fee || 0,
    reason_for_request: 'Yêu cầu thay đổi nơi trả container',
    reason_for_decision: null,
    carrier_comment: null,
    additional_info: null,
    created_at: request.created_at,
    updated_at: request.created_at,
    expires_at: null,
    delivery_confirmed_at: null,
    payment_confirmed_at: null,
    depot_processing_started_at: null,
    completed_at: null,
    
    // Nested objects with proper structure
    import_container: {
      id: request.booking_number,
      container_number: request.container_number,
      container_type: 'Dry Van',
      container_type_id: '1',
      drop_off_location: request.original_location,
      available_from_datetime: request.created_at,
      trucking_company_org_id: 'temp-trucking-org',
      shipping_line_org_id: 'temp-shipping-org',
      status: 'AWAITING_COD_APPROVAL' as any,
      is_listed_on_marketplace: false,
      latitude: null,
      longitude: null,
      condition_images: null,
      attached_documents: null,
      city_id: null,
      depot_id: null,
      cargo_type_id: null,
      created_at: request.created_at
    },
    requesting_org: {
      id: 'temp-org-id',
      name: request.requested_by_org?.name || 'N/A',
      type: 'TRUCKING_COMPANY' as any,
      tax_code: null,
      address: null,
      phone_number: null,
      status: 'ACTIVE' as any,
      created_at: request.created_at
    },
    approving_org: {
      id: 'temp-approving-org-id',
      name: 'LTA',
      type: 'SHIPPING_LINE' as any,
      tax_code: null,
      address: null,
      phone_number: null,
      status: 'ACTIVE' as any,
      created_at: request.created_at
    },
    requested_depot: {
      name: request.requested_location,
      address: request.requested_location
    }
  }
}



export default function CodRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [codRequests, setCodRequests] = useState<CodRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<CodRequest[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentFilters, setCurrentFilters] = useState<any>({
    page: 1,
    pageSize: 10,
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [userOrgId, setUserOrgId] = useState<string>('')
  
  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<CodRequestWithDetails | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'CARRIER_ADMIN') {
        router.push('/dashboard')
        return
      }

      setUserOrgId(profile.organization_id)

      // Get real COD requests from database
      const { data: codRequestsData, error: codError } = await supabase
        .from('cod_requests')
        .select(`
          *,
          import_container:import_containers!cod_requests_dropoff_order_id_fkey(
            id,
            container_number,
            container_type,
            drop_off_location
          ),
          requested_depot:gpg_depots!cod_requests_requested_depot_id_fkey(
            id,
            name,
            address
          ),
          requesting_org:organizations!cod_requests_requesting_org_id_fkey(
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (codError) {
        console.error('Error fetching COD requests:', codError)
        throw new Error(`Failed to fetch COD requests: ${codError.message}`)
      }

      // Transform data to match CodRequest interface
      const transformedData: CodRequest[] = (codRequestsData || []).map((request: any) => ({
        id: request.id,
        container_number: request.import_container?.container_number || 'N/A',
        booking_number: request.import_container?.id || 'N/A',
        original_location: request.original_depot_address || 'N/A',
        requested_location: `${request.requested_depot?.name || 'N/A'}${request.requested_depot?.address ? ', ' + request.requested_depot.address : ''}`,
        cod_fee: request.cod_fee || 0,
        status: request.status,
        created_at: request.created_at,
        requested_by_org: { name: request.requesting_org?.name || 'N/A' }
      }))

      setCodRequests(transformedData)
      setFilteredRequests(transformedData)
      setTotalCount(transformedData.length)

    } catch (err: any) {
      console.error('Error loading COD requests:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters)
    
    let filtered = [...codRequests]

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(req => 
        req.container_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.booking_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.requested_by_org?.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof CodRequest]
      const bVal = b[filters.sortBy as keyof CodRequest]
      
      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0
      if (aVal === undefined) return 1
      if (bVal === undefined) return -1
      
      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    // Apply pagination
    const startIndex = (filters.page - 1) * filters.pageSize
    const paginatedData = filtered.slice(startIndex, startIndex + filters.pageSize)

    setFilteredRequests(paginatedData)
    setTotalCount(filtered.length)
  }

  const handlePageChange = (page: number) => {
    handleFiltersChange({ ...currentFilters, page })
  }

  const handlePageSizeChange = (pageSize: number) => {
    handleFiltersChange({ ...currentFilters, pageSize, page: 1 })
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'PENDING': { text: 'Chờ duyệt Thay Đổi Địa Điểm', variant: 'pending-cod' as const },
      'APPROVED': { text: 'Đang thực hiện Thay Đổi Địa Điểm', variant: 'processing-cod' as const },
      'DECLINED': { text: 'Bị từ chối Thay Đổi Địa Điểm', variant: 'declined-cod' as const },
      'PENDING_PAYMENT': { text: 'Chờ thanh toán phí Thay Đổi Địa Điểm', variant: 'pending-cod-payment' as const },
      'PAID': { text: 'Đã thanh toán Thay Đổi Địa Điểm', variant: 'completed' as const },
      'PROCESSING_AT_DEPOT': { text: 'Đang xử lý tại Depot', variant: 'processing-depot' as const },
      'COMPLETED': { text: 'Hoàn tất', variant: 'completed' as const },
      'EXPIRED': { text: 'Hết hạn', variant: 'declined-cod' as const },
      'REVERSED': { text: 'Đã hủy', variant: 'declined-cod' as const },
      'AWAITING_INFO': { text: 'Chờ bổ sung thông tin', variant: 'warning' as const },
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const }
    return <Badge variant={statusInfo.variant} className="rounded-full">{statusInfo.text}</Badge>
  }

  const handleApprove = (request: CodRequest) => {
    const requestWithDetails = convertToCodRequestWithDetails(request)
    setSelectedRequest(requestWithDetails)
    setApprovalDialogOpen(true)
  }

  const handleReject = (request: CodRequest) => {
    const requestWithDetails = convertToCodRequestWithDetails(request)
    setSelectedRequest(requestWithDetails)
    setDeclineDialogOpen(true)
  }

  const handleViewDetails = (request: CodRequest) => {
    // For now, just show basic alert - can be enhanced later
    alert(`Chi tiết COD Request:\n\nContainer: ${request.container_number}\nCông ty: ${request.requested_by_org?.name}\nPhí: ${request.cod_fee.toLocaleString('vi-VN')} VNĐ\nTrạng thái: ${request.status}`)
  }

  const handleDeclineConfirm = async () => {
    if (!selectedRequest || !declineReason.trim()) {
      toast({
        title: "❌ Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive"
      })
      return
    }

    setActionLoading(true)
    try {
      const result = await handleCodDecision(selectedRequest.id, 'DECLINED', undefined, declineReason)

      if (result.success) {
        toast({
          title: "✅ Thành công",
          description: result.message,
          variant: "success"
        })
        
        // Refresh data
        await loadData()
        
        // Close dialog
        setDeclineDialogOpen(false)
        setSelectedRequest(null)
        setDeclineReason('')
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Error declining COD request:', error)
      toast({
        title: "❌ Lỗi",
        description: error.message || 'Có lỗi xảy ra khi từ chối yêu cầu',
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprovalDialogClose = () => {
    setApprovalDialogOpen(false)
    setSelectedRequest(null)
    // Refresh data after approval
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Có lỗi xảy ra</h1>
          <p className="text-text-secondary mb-6">Không thể tải dữ liệu yêu cầu thay đổi địa điểm.</p>
          <p className="text-sm text-text-secondary">Chi tiết lỗi: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/carrier-admin" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Yêu cầu Thay Đổi Địa Điểm</h1>
              <p className="text-text-secondary">
                Danh sách chi tiết tất cả yêu cầu thay đổi địa điểm ({totalCount} kết quả)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Tìm container, booking, công ty..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={currentFilters.search}
                  onChange={(e) => handleFiltersChange({ ...currentFilters, search: e.target.value, page: 1 })}
                />
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={currentFilters.status}
                  onChange={(e) => handleFiltersChange({ ...currentFilters, status: e.target.value, page: 1 })}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="DECLINED">Từ chối</option>
                  <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="PROCESSING_AT_DEPOT">Đang xử lý tại Depot</option>
                  <option value="COMPLETED">Hoàn tất</option>
                  <option value="EXPIRED">Hết hạn</option>
                  <option value="REVERSED">Đã hủy</option>
                </select>
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={currentFilters.sortBy}
                  onChange={(e) => handleFiltersChange({ ...currentFilters, sortBy: e.target.value })}
                >
                  <option value="created_at">Ngày tạo</option>
                  <option value="cod_fee">Phí COD</option>
                  <option value="container_number">Số container</option>
                  <option value="status">Trạng thái</option>
                </select>
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={currentFilters.sortOrder}
                  onChange={(e) => handleFiltersChange({ ...currentFilters, sortOrder: e.target.value })}
                >
                  <option value="desc">Giảm dần</option>
                  <option value="asc">Tăng dần</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Container</th>
                    <th className="text-left p-4 font-medium text-gray-900">Công ty</th>
                    <th className="text-left p-4 font-medium text-gray-900">Từ → Đến</th>
                    <th className="text-left p-4 font-medium text-gray-900">Phí COD (VNĐ)</th>
                    <th className="text-left p-4 font-medium text-gray-900">Trạng thái</th>
                    <th className="text-left p-4 font-medium text-gray-900">Ngày tạo</th>
                    <th className="text-left p-4 font-medium text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-primary">{request.container_number}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-900 max-w-xs truncate">
                          {request.requested_by_org?.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs space-y-1">
                          <div className="text-gray-600 truncate max-w-xs">
                            📍 {request.original_location}
                          </div>
                          <div className="text-gray-600 truncate max-w-xs">
                            🎯 {request.requested_location}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-lg text-green-600">
                          {request.cod_fee.toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          {formatStoredDateTimeVN(request.created_at)}
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Mở menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(request)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Chi tiết
                            </DropdownMenuItem>
                            {request.status === 'PENDING' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(request)}
                                  className="cursor-pointer text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Phê duyệt
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(request)}
                                  className="cursor-pointer text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Từ chối
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có yêu cầu Thay Đổi Địa Điểm</h3>
                <p className="text-gray-600">Chưa có yêu cầu thay đổi địa điểm nào phù hợp với bộ lọc của bạn.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentFilters.page}
              totalCount={totalCount}
              pageSize={currentFilters.pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>
      
      {/* Dialogs */}
      {selectedRequest && (
        <CodApprovalDialog
          isOpen={approvalDialogOpen}
          onClose={handleApprovalDialogClose}
          request={selectedRequest}
        />
      )}

      {/* Simple Decline Dialog */}
      {declineDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Từ chối yêu cầu Thay Đổi Địa Điểm</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Bạn đang từ chối yêu cầu Thay Đổi Địa Điểm cho container <strong>{selectedRequest?.import_container?.container_number}</strong>
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="Nhập lý do từ chối..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeclineDialogOpen(false)
                  setSelectedRequest(null)
                  setDeclineReason('')
                }}
                disabled={actionLoading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleDeclineConfirm}
                disabled={actionLoading || !declineReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? 'Đang xử lý...' : 'Từ chối'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}