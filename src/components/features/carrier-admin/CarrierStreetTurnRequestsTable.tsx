'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Search, Filter, Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react'
import { formatStoredDateTimeVN, formatDateVN } from '@/lib/utils'
import ApproveRequestDialog from './ApproveRequestDialog'
import DeclineRequestDialog from './DeclineRequestDialog'
import Pagination from '@/components/common/Pagination'

interface CarrierStreetTurnRequestsTableProps {
  requests: any[]
}

export default function CarrierStreetTurnRequestsTable({ requests }: CarrierStreetTurnRequestsTableProps) {
  const [filteredRequests, setFilteredRequests] = useState(requests)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'available_from' | 'needed_by'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    setFilteredRequests(requests)
  }, [requests])

  useEffect(() => {
    let filtered = [...requests]

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.import_container?.container_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requesting_org?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.import_container?.drop_off_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.export_booking?.pick_up_location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'created_at':
          aValue = a.created_at
          bValue = b.created_at
          break
        case 'available_from':
          aValue = a.import_container?.available_from_datetime
          bValue = b.import_container?.available_from_datetime
          break
        case 'needed_by':
          aValue = a.export_booking?.needed_by_datetime
          bValue = b.export_booking?.needed_by_datetime
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }
      
      if (!aValue && !bValue) return 0
      if (!aValue) return 1
      if (!bValue) return -1
      
      const comparison = new Date(aValue).getTime() - new Date(bValue).getTime()
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredRequests(filtered)
    setCurrentPage(1)
  }, [requests, searchTerm, sortBy, sortOrder])

  const startIndex = (currentPage - 1) * pageSize
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize)

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy('created_at')
    setSortOrder('desc')
  }

  const handleActionComplete = () => {
    window.location.reload()
  }

  return (
    <>
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-h3 text-text-primary flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Yêu Cầu Re-use Container
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm container, công ty, địa điểm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Select value={sortBy} onValueChange={(value: 'created_at' | 'available_from' | 'needed_by') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Ngày tạo</SelectItem>
                  <SelectItem value="available_from">Ngày có sẵn</SelectItem>
                  <SelectItem value="needed_by">Ngày cần</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-text-secondary">
            <div>
              Hiển thị {startIndex + 1}-{Math.min(startIndex + pageSize, filteredRequests.length)} 
              trong tổng số {filteredRequests.length} yêu cầu
              {requests.length !== filteredRequests.length && ` (lọc từ ${requests.length} yêu cầu)`}
            </div>
            <div>
              <span>Chờ duyệt: {requests.length}</span>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-body">
                {requests.length === 0 
                  ? 'Chưa có yêu cầu Re-use nào.' 
                  : 'Không tìm thấy yêu cầu nào với bộ lọc hiện tại.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="table-header">Công ty</th>
                    <th className="table-header">Container</th>
                    <th className="table-header">Lộ trình</th>
                    <th className="table-header">Thời gian</th>
                    <th className="table-header">Ngày gửi</th>
                    <th className="table-header">Tiết kiệm</th>
                    <th className="table-header text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRequests.map((request) => {
                    const container = request.import_container
                    const booking = request.export_booking
                    const requestingCompany = request.requesting_org

                    return (
                      <tr key={request.id} className="table-row">
                        <td className="table-cell">
                          <div className="text-label text-text-primary">
                            {requestingCompany?.name}
                          </div>
                          <div className="text-body-small text-text-secondary">
                            Công ty Vận tải
                          </div>
                        </td>
                        
                        <td className="table-cell">
                          <div className="space-y-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {container?.container_number}
                            </Badge>
                            <div className="text-xs text-text-secondary">
                              {container?.container_type}
                            </div>
                          </div>
                        </td>
                        
                        <td className="table-cell">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-body-small">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="text-text-secondary">Từ:</span>
                              <span className="text-text-primary font-medium max-w-[120px] truncate" title={container?.drop_off_location}>
                                {container?.drop_off_location}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-body-small">
                              <MapPin className="w-4 h-4 text-danger" />
                              <span className="text-text-secondary">Đến:</span>
                              <span className="text-text-primary font-medium max-w-[120px] truncate" title={booking?.pick_up_location}>
                                {booking?.pick_up_location}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="table-cell">
                          <div className="space-y-3 text-body-small">
                            <div>
                              <span className="text-text-secondary">Rảnh:</span>
                              <div className="font-medium text-primary">
                                {formatStoredDateTimeVN(container?.available_from_datetime)}
                              </div>
                            </div>
                            <div>
                              <span className="text-text-secondary">Cần:</span>
                              <div className="font-medium text-danger">
                                {formatStoredDateTimeVN(booking?.needed_by_datetime)}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="table-cell">
                          <div className="flex items-center gap-2 text-body-small">
                            <Calendar className="w-4 h-4 text-text-secondary" />
                            {formatDateVN(request.created_at)}
                          </div>
                        </td>
                        
                        <td className="table-cell">
                          <div className="space-y-1 text-body-small">
                            {request.estimated_cost_saving && (
                              <div className="text-primary font-medium">
                                ${request.estimated_cost_saving}
                              </div>
                            )}
                            {request.estimated_co2_saving_kg && (
                              <div className="text-info font-medium">
                                {request.estimated_co2_saving_kg}kg CO₂
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="table-cell text-center">
                          <div className="flex gap-2 justify-center">
                            <ApproveRequestDialog 
                              request={request} 
                              onActionComplete={handleActionComplete}
                            >
                              <Button
                                className="btn-primary min-w-[80px]"
                                size="sm"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Duyệt
                              </Button>
                            </ApproveRequestDialog>

                            <DeclineRequestDialog 
                              request={request} 
                              onActionComplete={handleActionComplete}
                            >
                              <Button
                                variant="destructive"
                                size="sm"
                                className="min-w-[80px] bg-red-600 hover:bg-red-700 text-white"
                              >
                                <XCircle className="w-4 h-4" />
                                Từ chối
                              </Button>
                            </DeclineRequestDialog>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredRequests.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalCount={filteredRequests.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </>
  )
}