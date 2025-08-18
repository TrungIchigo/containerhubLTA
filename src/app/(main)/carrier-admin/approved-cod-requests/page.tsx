'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, Download, DollarSign, MoreHorizontal, Eye, Receipt, FileText } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/common/Pagination'
import { Badge } from '@/components/ui/badge'
import { formatStoredDateTimeVN } from '@/lib/utils'

interface ApprovedCodRequest {
  id: string
  container_number: string
  booking_number: string
  original_location: string
  requested_location: string
  payment_amount: number
  approved_at: string
  payment_due_date: string
  status: string
  requested_by_org?: { name: string }
  invoice_number?: string
  payment_method?: string
}

export default function ApprovedCodRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvedRequests, setApprovedRequests] = useState<ApprovedCodRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ApprovedCodRequest[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentFilters, setCurrentFilters] = useState<any>({
    page: 1,
    pageSize: 10,
    search: '',
    status: 'all',
    sortBy: 'approved_at',
    sortOrder: 'desc'
  })
  const [userOrgId, setUserOrgId] = useState<string>('')

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

      // Get real approved COD requests from database
      const { data: approvedRequestsData, error: approvedError } = await supabase
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
        .in('status', ['APPROVED', 'PENDING_PAYMENT', 'PAID'])
        .order('created_at', { ascending: false })

      if (approvedError) {
        console.error('Error fetching approved COD requests:', approvedError)
        throw new Error(`Failed to fetch approved COD requests: ${approvedError.message}`)
      }

      // Transform data to match ApprovedCodRequest interface
      const transformedData: ApprovedCodRequest[] = (approvedRequestsData || []).map((request: any) => {
        const paymentDueDate = request.payment_confirmed_at || 
          new Date(new Date(request.updated_at || request.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        
        return {
          id: request.id,
          container_number: request.import_container?.container_number || 'N/A',
          booking_number: request.import_container?.id || 'N/A',
          original_location: request.original_depot_address || 'N/A',
          requested_location: `${request.requested_depot?.name || 'N/A'}${request.requested_depot?.address ? ', ' + request.requested_depot.address : ''}`,
          payment_amount: request.cod_fee || 0,
          approved_at: request.updated_at || request.created_at,
          payment_due_date: paymentDueDate,
          status: request.status === 'APPROVED' ? 'AWAITING_PAYMENT' : request.status === 'PENDING_PAYMENT' ? 'AWAITING_PAYMENT' : 'PAID',
          requested_by_org: { name: request.requesting_org?.name || 'N/A' },
          invoice_number: `INV-${request.id.slice(0, 8).toUpperCase()}`,
          payment_method: 'BANK_TRANSFER'
        }
      })

      setApprovedRequests(transformedData)
      setFilteredRequests(transformedData)
      setTotalCount(transformedData.length)

    } catch (err: any) {
      console.error('Error loading approved COD requests:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters)
    
    let filtered = [...approvedRequests]

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(req => 
        req.container_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.booking_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.requested_by_org?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.invoice_number?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof ApprovedCodRequest]
      const bVal = b[filters.sortBy as keyof ApprovedCodRequest]
      
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
      'AWAITING_PAYMENT': { text: 'Chờ thanh toán phí Thay Đổi Địa Điểm', variant: 'pending-cod-payment' as const },
      'PAID': { text: 'Đã thanh toán Thay Đổi Địa Điểm', variant: 'completed' as const },
      'OVERDUE': { text: 'Quá hạn thanh toán', variant: 'destructive' as const },
      'PROCESSING': { text: 'Đang xử lý tại Depot', variant: 'processing-depot' as const },
      'COMPLETED': { text: 'Hoàn tất Thay Đổi Địa Điểm', variant: 'completed' as const },
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const }
    return <Badge variant={statusInfo.variant} className="rounded-full">{statusInfo.text}</Badge>
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleProcessPayment = (request: ApprovedCodRequest) => {
    console.log('Process payment:', request.id)
    // TODO: Implement payment processing logic
  }

  const handleViewInvoice = (request: ApprovedCodRequest) => {
    console.log('View invoice:', request.invoice_number)
    // TODO: Implement invoice viewing logic
  }

  const handleViewDetails = (request: ApprovedCodRequest) => {
    console.log('View details:', request.id)
    // TODO: Implement view details logic
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
          <p className="text-text-secondary mb-6">Không thể tải dữ liệu COD đã duyệt.</p>
          <p className="text-sm text-text-secondary">Chi tiết lỗi: {error}</p>
        </div>
      </div>
    )
  }

  const totalAwaitingPayment = approvedRequests
    .filter(req => req.status === 'AWAITING_PAYMENT')
    .reduce((sum, req) => sum + req.payment_amount, 0)

  const totalOverdue = approvedRequests
    .filter(req => req.status === 'OVERDUE')
    .reduce((sum, req) => sum + req.payment_amount, 0)

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
              <h1 className="text-3xl font-bold text-text-primary">COD Đã Duyệt Chờ Thanh Toán</h1>
              <p className="text-text-secondary">
                Danh sách chi tiết COD đã được duyệt và đang chờ thanh toán ({totalCount} kết quả)
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Chờ thanh toán</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {totalAwaitingPayment.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quá hạn</p>
                  <p className="text-lg font-bold text-red-600">
                    {totalOverdue.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng đã duyệt</p>
                  <p className="text-lg font-bold text-green-600">
                    {approvedRequests.reduce((sum, req) => sum + req.payment_amount, 0).toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Tìm container, booking, invoice..."
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
                  <option value="AWAITING_PAYMENT">Chờ thanh toán</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="OVERDUE">Quá hạn</option>
                  <option value="PROCESSING">Đang xử lý</option>
                </select>
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={currentFilters.sortBy}
                  onChange={(e) => handleFiltersChange({ ...currentFilters, sortBy: e.target.value })}
                >
                  <option value="approved_at">Ngày duyệt</option>
                  <option value="payment_due_date">Hạn thanh toán</option>
                  <option value="payment_amount">Số tiền</option>
                  <option value="container_number">Số container</option>
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
                    <th className="text-left p-4 font-medium text-gray-900">Số tiền</th>
                    <th className="text-left p-4 font-medium text-gray-900">Hóa đơn</th>
                    <th className="text-left p-4 font-medium text-gray-900">Hạn thanh toán</th>
                    <th className="text-left p-4 font-medium text-gray-900">Trạng thái</th>
                    <th className="text-left p-4 font-medium text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-primary">{request.container_number}</div>
                        <div className="text-xs text-gray-500">{request.booking_number}</div>
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
                          {request.payment_amount.toLocaleString('vi-VN')} VNĐ
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium">{request.invoice_number}</div>
                          <div className="text-gray-500 text-xs">{request.payment_method}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`text-sm ${isOverdue(request.payment_due_date) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {formatStoredDateTimeVN(request.payment_due_date)}
                        </div>
                        {request.status === 'AWAITING_PAYMENT' && (
                          <div className={`text-xs mt-1 ${getDaysUntilDue(request.payment_due_date) <= 1 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {getDaysUntilDue(request.payment_due_date) > 0 
                              ? `Còn ${getDaysUntilDue(request.payment_due_date)} ngày`
                              : 'Hôm nay'
                            }
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(request.status)}
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
                            <DropdownMenuItem
                              onClick={() => handleViewInvoice(request)}
                              className="cursor-pointer"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Xem hóa đơn
                            </DropdownMenuItem>
                            {request.status === 'AWAITING_PAYMENT' && (
                              <DropdownMenuItem
                                onClick={() => handleProcessPayment(request)}
                                className="cursor-pointer text-blue-600"
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Thanh toán
                              </DropdownMenuItem>
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
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có COD chờ thanh toán</h3>
                <p className="text-gray-600">Chưa có COD nào đã được duyệt và chờ thanh toán phù hợp với bộ lọc của bạn.</p>
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
    </div>
  )
}