'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Phone, FileText, AlertCircle } from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string | null
  email: string
  role: string
  avatar_url?: string | null
  phone_number?: string | null
  organization?: {
    name: string
    tax_code?: string
    address?: string
    phone_number?: string
    status?: string
  }
}

interface OrganizationDetailsProps {
  profile: UserProfile
}

/**
 * Component hiển thị thông tin tổ chức (chỉ đọc)
 * @param profile - Thông tin profile chứa dữ liệu tổ chức
 */
export function OrganizationDetails({ profile }: OrganizationDetailsProps) {
  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'hoạt động':
        return 'default'
      case 'inactive':
      case 'tạm dừng':
        return 'secondary'
      case 'suspended':
      case 'đình chỉ':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusDisplayName = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'Hoạt động'
      case 'inactive':
        return 'Tạm dừng'
      case 'suspended':
        return 'Đình chỉ'
      default:
        return status || 'Không xác định'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'DISPATCHER':
        return 'Bạn có quyền quản lý và điều phối các yêu cầu vận chuyển trong tổ chức này.'
      case 'CARRIER_ADMIN':
        return 'Bạn có quyền quản trị toàn bộ hoạt động của công ty vận tải này.'
      case 'PLATFORM_ADMIN':
        return 'Bạn có quyền quản trị toàn bộ hệ thống ContainerHub.'
      default:
        return 'Vai trò của bạn trong tổ chức.'
    }
  }

  if (!profile.organization) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Thông tin Tổ chức
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Chưa có thông tin tổ chức</p>
              <p className="text-sm text-yellow-700">
                Tài khoản của bạn chưa được liên kết với tổ chức nào.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4 pt-4 pl-3">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Thông tin Tổ chức
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-8 pb-8">
        {/* Organization Basic Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {profile.organization.name}
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                {getRoleDescription(profile.role)}
              </p>
            </div>
            {profile.organization.status && (
              <Badge variant={getStatusBadgeVariant(profile.organization.status)}>
                {getStatusDisplayName(profile.organization.status)}
              </Badge>
            )}
          </div>
        </div>

        {/* Organization Details */}
        <div className="grid gap-4">
          {profile.organization.tax_code && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-text-primary">Mã số thuế</p>
                <p className="text-sm text-text-secondary">{profile.organization.tax_code}</p>
              </div>
            </div>
          )}
          
          {profile.organization.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">Địa chỉ</p>
                <p className="text-sm text-text-secondary">{profile.organization.address}</p>
              </div>
            </div>
          )}
          
          {profile.organization.phone_number && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-text-primary">Số điện thoại</p>
                <p className="text-sm text-text-secondary">{profile.organization.phone_number}</p>
              </div>
            </div>
          )}
        </div>

        {/* Role Information */}
        <div className="pt-4 border-t">
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">Vai trò của bạn</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {profile.role === 'DISPATCHER' ? 'Điều phối viên' : 
                 profile.role === 'CARRIER_ADMIN' ? 'Carrier Admin' : 
                 profile.role === 'PLATFORM_ADMIN' ? 'Platform Admin' : profile.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Note for Dispatcher */}
        {profile.role === 'DISPATCHER' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Lưu ý</p>
                <p className="text-sm text-blue-700">
                  Thông tin tổ chức chỉ có thể được chỉnh sửa bởi Admin. 
                  Nếu cần thay đổi, vui lòng liên hệ với quản trị viên của tổ chức.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}