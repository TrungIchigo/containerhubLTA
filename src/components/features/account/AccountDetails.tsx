'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountDetailsProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    avatar_url?: string;
  };
  onUpdateProfile: (data: {
    full_name: string;
    phone_number?: string;
    avatar_url?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onUploadAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
}

/**
 * AccountDetails component for editing user profile information
 * Allows users to update their personal details and avatar
 * @param props - Component props containing user data and update handlers
 * @returns JSX element for the account details form
 */
export function AccountDetails({ user, onUpdateProfile, onUploadAvatar }: AccountDetailsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    phone_number: user.phone_number || '',
  });
  
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Check if there are changes
    const newData = { ...formData, [field]: value };
    const hasFormChanges = 
      newData.full_name !== user.full_name ||
      newData.phone_number !== (user.phone_number || '');
    
    setHasChanges(hasFormChanges);
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn file hình ảnh hợp lệ.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'Kích thước file không được vượt quá 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      const result = await onUploadAvatar(file);
      
      if (result.success && result.url) {
        setAvatarUrl(result.url);
        toast({
          title: 'Thành công',
          description: 'Cập nhật ảnh đại diện thành công.',
        });
      } else {
        throw new Error(result.error || 'Không thể tải lên ảnh đại diện');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải lên ảnh đại diện.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!hasChanges) {
      toast({
        title: 'Thông báo',
        description: 'Không có thay đổi nào để lưu.',
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      const result = await onUpdateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number || undefined,
        avatar_url: avatarUrl,
      });
      
      if (result.success) {
        setHasChanges(false);
        toast({
          title: 'Thành công',
          description: 'Cập nhật thông tin cá nhân thành công.',
        });
      } else {
        throw new Error(result.error || 'Không thể cập nhật thông tin');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật thông tin.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      full_name: user.full_name || '',
      phone_number: user.phone_number || '',
    });
    setAvatarUrl(user.avatar_url);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt={formData.full_name} />
                <AvatarFallback className="text-xl font-semibold">
                  {getInitials(formData.full_name)}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload Button Overlay */}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và Tên *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Nhập họ và tên"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email không thể thay đổi. Liên hệ quản trị viên nếu cần hỗ trợ.
              </p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Số điện thoại</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="Nhập số điện thoại"
                type="tel"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy bỏ
            </Button>
            
            <Button
              type="submit"
              disabled={!hasChanges || isUpdating}
              className={cn(
                hasChanges && 'bg-primary hover:bg-primary/90'
              )}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}