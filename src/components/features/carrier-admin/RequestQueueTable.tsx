'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, ArrowRight, Clock, MapPin, Calendar } from 'lucide-react'
import ApproveRequestDialog from './ApproveRequestDialog'
import DeclineRequestDialog from './DeclineRequestDialog'
import { formatStoredDateTimeVN, formatDateVN } from '@/lib/utils'

interface RequestQueueTableProps {
  requests: any[]
}

export default function RequestQueueTable({ requests }: RequestQueueTableProps) {
  const handleActionComplete = (success: boolean, message: string) => {
    // Tạm thời sử dụng alert, có thể thay thế bằng toast library sau
    alert(message)
  }



  if (requests.length === 0) {
    return (
      <Card className="card">
        <CardHeader>
          <CardTitle className="text-h3 text-text-primary flex items-center gap-2">
            <Clock className="w-6 h-6 text-accent" />
            Danh sách Yêu cầu đang chờ xử lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-h3 text-text-primary mb-2">
              Không có yêu cầu nào đang chờ xử lý
            </h3>
            <p className="text-body text-text-secondary">
              Tất cả yêu cầu Re-use đã được xử lý xong.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card">
      <CardHeader>
        <CardTitle className="text-h3 text-text-primary flex items-center gap-2">
          <Clock className="w-6 h-6 text-accent" />
          Danh sách Yêu cầu đang chờ xử lý
          <Badge className="status-pending ml-2">
            {requests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="table-header">Công ty Yêu cầu</TableHead>
                <TableHead className="table-header">Container Đề xuất</TableHead>
                <TableHead className="table-header">Lộ trình Đề xuất</TableHead>
                <TableHead className="table-header">Khung thời gian</TableHead>
                <TableHead className="table-header">Ngày gửi</TableHead>
                <TableHead className="table-header">Tiết kiệm ước tính</TableHead>
                <TableHead className="table-header text-center">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const container = request.import_container
                const booking = request.export_booking
                const requestingCompany = request.requesting_org

                return (
                  <TableRow key={request.id} className="table-row">
                    <TableCell className="table-cell">
                      <div className="text-label text-text-primary">
                        {requestingCompany?.name}
                      </div>
                      <div className="text-body-small text-text-secondary">
                        Công ty Vận tải
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell">
                      <div className="space-y-2">
                        <div className="text-label text-text-primary">
                          {container?.container_number}
                        </div>
                        <Badge variant="outline" className="text-body-small">
                          {container?.container_type}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-body-small">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-text-secondary">Từ:</span>
                          <span className="text-text-primary font-medium">
                            {container?.drop_off_location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-body-small">
                          <MapPin className="w-4 h-4 text-danger" />
                          <span className="text-text-secondary">Đến:</span>
                          <span className="text-text-primary font-medium">
                            {booking?.pick_up_location}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell">
                      <div className="space-y-3 text-body-small">
                        <div>
                          <span className="text-text-secondary">Rảnh từ:</span>
                          <div className="font-medium text-primary">
                            {formatStoredDateTimeVN(container?.available_from_datetime)}
                          </div>
                        </div>
                        <div>
                          <span className="text-text-secondary">Cần trước:</span>
                          <div className="font-medium text-danger">
                            {formatStoredDateTimeVN(booking?.needed_by_datetime)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell">
                      <div className="flex items-center gap-2 text-body-small">
                        <Calendar className="w-4 h-4 text-text-secondary" />
                        {formatDateVN(request.created_at)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="table-cell">
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
                    </TableCell>
                    
                    <TableCell className="table-cell">
                      <div className="flex gap-2 justify-center">
                        <ApproveRequestDialog 
                          request={request} 
                          onActionComplete={handleActionComplete}
                        >
                          <Button
                            className="btn-primary min-w-[100px]"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Phê duyệt
                          </Button>
                        </ApproveRequestDialog>

                        <DeclineRequestDialog 
                          request={request} 
                          onActionComplete={handleActionComplete}
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircle className="w-4 h-4" />
                            Từ chối
                          </Button>
                        </DeclineRequestDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}