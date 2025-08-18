'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSidebarProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
    phone_number?: string;
  };
  organization: {
    name: string;
    type?: string;
  } | null;
  activeSection: 'profile' | 'organization' | 'security';
  onSectionChange: (section: 'profile' | 'organization' | 'security') => void;
  onSignOut: () => void;
}

/**
 * ProfileSidebar component for the account management page
 * Displays user avatar, basic info, and navigation menu
 * @param props - Component props containing user data and handlers
 * @returns JSX element for the profile sidebar
 */
export function ProfileSidebar({
  user,
  organization,
  activeSection,
  onSectionChange,
  onSignOut,
}: ProfileSidebarProps) {
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role display text and color
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

  const roleInfo = getRoleInfo(user.role);

  const menuItems = [
    {
      id: 'profile' as const,
      label: 'Hồ sơ',
      icon: User,
    },
    {
      id: 'organization' as const,
      label: 'Thông tin Tổ chức',
      icon: Building2,
    },
    {
      id: 'security' as const,
      label: 'Bảo mật & Đăng nhập',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Quick View */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar */}
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              
              {/* Role Badge */}
              <Badge className={cn('text-xs', roleInfo.color)}>
                {roleInfo.text}
              </Badge>

              {/* Organization */}
              {organization && (
                <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{organization.name}</span>
                </div>
              )}

              {/* Phone Number */}
              {user.phone_number && (
                <p className="text-sm text-muted-foreground">
                  {user.phone_number}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Menu */}
      <Card>
        <CardContent className="p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start h-auto p-3',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => onSectionChange(item.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Sign Out Button */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}