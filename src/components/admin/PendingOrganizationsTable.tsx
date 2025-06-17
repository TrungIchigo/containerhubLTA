'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Building2, Calendar, Mail, Phone, User, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface PendingOrganization {
  id: string
  name: string
  type: string
  business_license_number: string
  address: string
  phone_number: string
  status: string
  created_at: string
  representative_email: string
  representative_name: string
  representative_phone: string
  user_full_name: string
  user_email: string
  user_id: string
}

interface PendingOrganizationsTableProps {
  organizations: PendingOrganization[]
}

export function PendingOrganizationsTable({ organizations }: PendingOrganizationsTableProps) {
  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có tổ chức nào chờ duyệt</h3>
        <p className="mt-1 text-sm text-gray-500">
          Tất cả các yêu cầu đăng ký đều đã được xử lý
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tổ chức</TableHead>
            <TableHead>Người đại diện</TableHead>
            <TableHead>Thông tin liên hệ</TableHead>
            <TableHead>Thời gian đăng ký</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id} className="hover:bg-gray-50">
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-gray-900">{org.name}</div>
                  <div className="text-sm text-gray-500">
                    {org.type === 'TRUCKING_COMPANY' ? 'Công ty vận tải' : 
                     org.type === 'LOGISTICS_COMPANY' ? 'Công ty logistics' : 
                     org.type === 'FREIGHT_FORWARDER' ? 'Đại lý vận tải' : org.type}
                  </div>
                  <div className="text-xs text-gray-400">
                    MST: {org.business_license_number}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {org.representative_name || org.user_full_name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Người đăng ký: {org.user_full_name}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {org.representative_email || org.user_email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {org.representative_phone || org.phone_number || 'Chưa cung cấp'}
                    </span>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {formatDistanceToNow(new Date(org.created_at), { 
                      addSuffix: true, 
                      locale: vi 
                    })}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(org.created_at).toLocaleDateString('vi-VN')}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Chờ phê duyệt
                </Badge>
              </TableCell>
              
              <TableCell className="text-right">
                <Link href={`/admin/organizations/${org.id}`}>
                  <Button variant="outline" size="sm" className="h-8">
                    <Eye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 