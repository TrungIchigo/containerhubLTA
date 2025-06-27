import { notFound } from 'next/navigation'
import { getOrganizationForAdminReview } from '@/lib/actions/admin'

import { AdminActionButtons } from '@/components/admin/AdminActionButtons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Calendar, User, Mail, Phone, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface PageProps {
  params: Promise<{
    orgId: string
  }>
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { orgId } = await params
  const organization = await getOrganizationForAdminReview(orgId)

  if (!organization) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_ADMIN_APPROVAL':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Chờ phê duyệt</Badge>
      case 'ACTIVE':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã phê duyệt</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Đã từ chối</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TRUCKING_COMPANY':
        return 'Công ty vận tải'
      case 'LOGISTICS_COMPANY':
        return 'Công ty logistics'
      case 'FREIGHT_FORWARDER':
        return 'Đại lý vận tải'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết tổ chức</h1>
            <p className="text-gray-600">{organization.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(organization.status)}
          {organization.status === 'PENDING_ADMIN_APPROVAL' && (
            <AdminActionButtons organizationId={orgId} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organization Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Thông tin tổ chức</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tên tổ chức</label>
                  <p className="mt-1 text-sm text-gray-900">{organization.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Loại hình</label>
                  <p className="mt-1 text-sm text-gray-900">{getTypeLabel(organization.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mã số thuế</label>
                  <p className="mt-1 text-sm text-gray-900">{organization.business_license_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="mt-1 text-sm text-gray-900">{organization.phone_number || 'Chưa cung cấp'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                <p className="mt-1 text-sm text-gray-900">{organization.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Representative Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Thông tin người đại diện</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {organization.representative_name || organization.user_full_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {organization.representative_email || organization.user_email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {organization.representative_phone || 'Chưa cung cấp'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Người đăng ký</label>
                  <p className="mt-1 text-sm text-gray-900">{organization.user_full_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Reason (if rejected) */}
          {organization.status === 'REJECTED' && organization.admin_rejection_reason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <FileText className="h-5 w-5" />
                  <span>Lý do từ chối</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">{organization.admin_rejection_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Lịch sử</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Đăng ký tổ chức</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(organization.created_at), { 
                        addSuffix: true, 
                        locale: vi 
                      })}
                    </p>
                  </div>
                </div>

                {organization.approved_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Đã phê duyệt</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(organization.approved_at), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {organization.rejected_at && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Đã từ chối</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(organization.rejected_at), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {organization.status === 'PENDING_ADMIN_APPROVAL' && (
            <Card>
              <CardHeader>
                <CardTitle>Hành động</CardTitle>
                <CardDescription>
                  Xem xét và đưa ra quyết định phê duyệt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminActionButtons organizationId={orgId} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 