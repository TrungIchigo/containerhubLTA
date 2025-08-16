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

interface StreetTurnRequest {
  id: string
  container_number: string
  pickup_company_name: string
  pickup_location: string
  dropoff_location: string
  needed_by: string
  cost_saving: number
  co2_saving: number
  status: string
  created_at: string
}

export default function StreetTurnRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streetTurnRequests, setStreetTurnRequests] = useState<StreetTurnRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<StreetTurnRequest[]>([])
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

      // Mock data for demonstration - replace with real query
      const mockData: StreetTurnRequest[] = [
        {
          id: '1',
          container_number: 'MSKU8186290',
          pickup_company_name: 'Công ty Vận tải ABC',
          pickup_location: 'ICD Nam Định Vũ, Hải Phòng',
          dropoff_location: 'Cảng Cát Lái, TP.HCM',
          needed_by: '2025-01-23T14:00:00Z',
          cost_saving: 3750000,
          co2_saving: 250,
          status: 'PENDING',
          created_at: '2025-01-21T09:30:00Z'
        },
        {
          id: '2',
          container_number: 'TEMU7234567',
          pickup_company_name: 'Công ty Logistics XYZ',
          pickup_location: 'ICD Tân Cảng, TP.HCM',
          dropoff_location: 'Cảng Hải Phòng',
          needed_by: '2025-01-24T16:00:00Z',
          cost_saving: 2800000,
          co2_saving: 180,
          status: 'PENDING',
          created_at: '2025-01-21T10:15:00Z'
        },
        {
          id: '3',
          container_number: 'COSCO789456',
          pickup_company_name: 'Công ty Thương mại DEF',
          pickup_location: 'ICD Dry Port, Hà Nội',
          dropoff_location: 'Cảng Hải Phòng',
          needed_by: '2025-01-25T10:00:00Z',
          cost_saving: 4200000,
          co2_saving: 300,
          status: 'APPROVED',
          created_at: '2025-01-20T14:20:00Z'
        },
        {
          id: '4',
          container_number: 'PILU6111141',
          pickup_company_name: 'Công ty Vận tải GHI',
          pickup_location: 'Khu phố Bình đăng, Bình Hòa',
          dropoff_location: 'ICD Hoàng Thành, Hà Nội',
          needed_by: '2025-01-22T12:00:00Z',
          cost_saving: 1950000,
          co2_saving: 120,
          status: 'REJECTED',
          created_at: '2025-01-19T16:45:00Z'
        }
      ]

      setStreetTurnRequests(mockData)
      setFilteredRequests(mockData)
      setTotalCount(mockData.length)

    } catch (err: any) {
      console.error('Error loading street turn requests:', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters)
    
    let filtered = [...streetTurnRequests]

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(req => 
        req.container_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.pickup_company_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.pickup_location.toLowerCase().includes(filters.search.toLowerCase()) ||
        req.dropoff_location.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof StreetTurnRequest]
      const bVal = b[filters.sortBy as keyof StreetTurnRequest]
      
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
      'PENDING': { text: 'Chờ duyệt Re-use', variant: 'pending-reuse' as const },
      'APPROVED': { text: 'Đang thực hiện Re-use', variant: 'processing-reuse' as const },
      'REJECTED': { text: 'Bị từ chối Re-use', variant: 'declined-reuse' as const },
      'COMPLETED': { text: 'Hoàn tất', variant: 'completed' as const },
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const }
    return <Badge variant={statusInfo.variant} className="rounded-full">{statusInfo.text}</Badge>
  }

  const isNearDeadline = (neededBy: string) => {
    const now = new Date()
    const deadline = new Date(neededBy)
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    return diffHours <= 24 && diffHours > 0
  }

  const handleApprove = (request: StreetTurnRequest) => {
    console.log('Approve request:', request.id)
    // TODO: Implement approve logic
  }

  const handleReject = (request: StreetTurnRequest) => {
    console.log('Reject request:', request.id)
    // TODO: Implement reject logic
  }

  const handleViewDetails = (request: StreetTurnRequest) => {
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
          <p className="text-text-secondary mb-6">Không thể tải dữ liệu yêu cầu Re-use.</p>
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
              <h1 className="text-3xl font-bold text-text-primary">Yêu cầu Re-use</h1>
              <p className="text-text-secondary">
                Danh sách chi tiết tất cả yêu cầu Re-use container ({totalCount} kết quả)
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
                  placeholder="Tìm container, công ty, địa điểm..."
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
                  <option value="REJECTED">Từ chối</option>
                  <option value="COMPLETED">Hoàn thành</option>
                </select>
              </div>
              <div>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={currentFilters.sortBy}
                  onChange={(e) => handleFiltersChange({ ...currentFilters, sortBy: e.target.value })}
                >
                  <option value="created_at">Ngày tạo</option>
                  <option value="needed_by">Ngày cần</option>
                  <option value="cost_saving">Tiết kiệm chi phí</option>
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
                    <th className="text-left p-4 font-medium text-gray-900">Hạn</th>
                    <th className="text-left p-4 font-medium text-gray-900">Lợi ích</th>
                    <th className="text-left p-4 font-medium text-gray-900">Trạng thái</th>
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
                          {request.pickup_company_name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs space-y-1">
                          <div className="text-gray-600 truncate max-w-xs">
                            📍 {request.pickup_location}
                          </div>
                          <div className="text-gray-600 truncate max-w-xs">
                            🎯 {request.dropoff_location}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`text-sm ${isNearDeadline(request.needed_by) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {formatStoredDateTimeVN(request.needed_by)}
                        </div>
                        {isNearDeadline(request.needed_by) && (
                          <Badge variant="destructive" className="text-xs mt-1 rounded-full">
                            Gấp!
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm space-y-1">
                          <div className="text-green-600 font-medium">
                            💰 {request.cost_saving.toLocaleString('vi-VN')} VNĐ
                          </div>
                          <div className="text-blue-600 text-xs">
                            🌱 {request.co2_saving} kg CO₂
                          </div>
                        </div>
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
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">♻️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có yêu cầu Re-use</h3>
                <p className="text-gray-600">Chưa có yêu cầu Re-use nào phù hợp với bộ lọc của bạn.</p>
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