'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Building2, 
  Mail, 
  Shield, 
  LogOut, 
  RefreshCw,
  Database,
  ExternalLink
} from 'lucide-react'
import { LtaLoadingCompact } from '@/components/ui/ltaloading'

export function UserProfile() {
  const { user, isLoading, logout, refreshUser } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshUser()
    setIsRefreshing(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    setIsLoggingOut(false)
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <LtaLoadingCompact />
          <span className="ml-2 text-muted-foreground">Đang tải thông tin...</span>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <span className="text-muted-foreground">Chưa đăng nhập</span>
        </CardContent>
      </Card>
    )
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'supabase':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'edepot':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.supabaseUser?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {getInitials(user.fullName || user.email)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="space-y-2">
          <CardTitle className="text-xl font-bold">
            {user.fullName || 'Người dùng'}
          </CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Badge className={getSourceBadgeColor(user.source)}>
              <Database className="w-3 h-3 mr-1" />
              {user.source === 'supabase' ? 'Supabase' : 'eDepot'}
            </Badge>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Mail className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {user.role && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Vai trò</p>
                <p className="text-sm text-muted-foreground">{user.role}</p>
              </div>
            </div>
          )}

          {user.organizationName && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Tổ chức</p>
                <p className="text-sm text-muted-foreground">{user.organizationName}</p>
              </div>
            </div>
          )}
        </div>

        {/* eDepot Specific Information */}
        {user.source === 'edepot' && user.eDepotUser && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Thông tin eDepot
            </h4>
            <div className="space-y-2 text-sm">
              {user.eDepotUser.profile?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Điện thoại:</span>
                  <span className="font-medium">{user.eDepotUser.profile.phone}</span>
                </div>
              )}
              {user.eDepotUser.profile?.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phòng ban:</span>
                  <span className="font-medium">{user.eDepotUser.profile.department}</span>
                </div>
              )}
              {user.eDepotUser.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đăng nhập cuối:</span>
                  <span className="font-medium">
                    {new Date(user.eDepotUser.lastLoginAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <LtaLoadingCompact className="w-4 h-4 mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Làm mới
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            className="flex-1"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <LtaLoadingCompact className="w-4 h-4 mr-2" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Đăng xuất
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default UserProfile