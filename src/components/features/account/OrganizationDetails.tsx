'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, MapPin, Phone, Mail, Globe, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganizationDetailsProps {
  organization: {
    id: string;
    name: string;
    type: string;
    created_at: string;
  } | null;
  userRole: string;
}

/**
 * OrganizationDetails component for displaying organization information
 * Shows read-only organization details and user's role within the organization
 * @param props - Component props containing organization data and user role
 * @returns JSX element for the organization details display
 */
export function OrganizationDetails({ organization, userRole }: OrganizationDetailsProps) {
  // Get organization type display info
  const getOrgTypeInfo = (type?: string) => {
    if (!type) return { text: 'Không xác định', color: 'bg-gray-100 text-gray-800' };
    
    switch (type.toLowerCase()) {
      case 'shipping_company':
        return { text: 'Công ty vận tải', color: 'bg-blue-100 text-blue-800' };
      case 'logistics_provider':
        return { text: 'Nhà cung cấp logistics', color: 'bg-green-100 text-green-800' };
      case 'freight_forwarder':
        return { text: 'Đại lý vận tải', color: 'bg-purple-100 text-purple-800' };
      case 'port_operator':
        return { text: 'Nhà khai thác cảng', color: 'bg-orange-100 text-orange-800' };
      case 'customs_broker':
        return { text: 'Đại lý hải quan', color: 'bg-red-100 text-red-800' };
      default:
        return { text: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Get user role display info
  const getRoleInfo = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { text: 'Quản trị viên', color: 'bg-red-100 text-red-800' };
      case 'manager':
        return { text: 'Quản lý', color: 'bg-blue-100 text-blue-800' };
      case 'user':
        return { text: 'Người dùng', color: 'bg-green-100 text-green-800' };
      default:
        return { text: role, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Không xác định';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Không xác định';
    }
  };

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thông tin Tổ chức</CardTitle>
          <CardDescription>
            Thông tin về tổ chức mà bạn đang làm việc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Chưa có thông tin tổ chức
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Tài khoản của bạn chưa được liên kết với tổ chức nào. 
              Liên hệ quản trị viên để được hỗ trợ.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const orgTypeInfo = getOrgTypeInfo(organization.type);
  const roleInfo = getRoleInfo(userRole);

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Thông tin Tổ chức</span>
          </CardTitle>
          <CardDescription>
            Thông tin chi tiết về tổ chức mà bạn đang làm việc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Name and Type */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-semibold">{organization.name}</h3>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={cn('text-xs', orgTypeInfo.color)}>
                  {orgTypeInfo.text}
                </Badge>
                <Badge className={cn('text-xs', roleInfo.color)}>
                  Vai trò: {roleInfo.text}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Ngày tạo</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(organization.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Lưu ý:</strong> Để cập nhật thông tin chi tiết của tổ chức (địa chỉ, số điện thoại, email đại diện), 
              vui lòng liên hệ với quản trị viên hệ thống.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-amber-400 rounded-full mt-2"></div>
            </div>
            <div>
              <p className="text-sm text-amber-800">
                <strong>Lưu ý:</strong> Thông tin tổ chức chỉ có thể được cập nhật bởi quản trị viên. 
                Nếu bạn phát hiện thông tin không chính xác, vui lòng liên hệ với quản trị viên của tổ chức.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}