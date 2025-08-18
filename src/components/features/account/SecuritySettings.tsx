'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Shield, 
  Key, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecuritySettingsProps {
  user: {
    id: string;
    email: string;
    edepot_linked?: boolean;
    edepot_username?: string;
    last_password_change?: string;
  };
  onChangePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onLinkEDepot: (credentials: {
    username: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onUnlinkEDepot: () => Promise<{ success: boolean; error?: string }>;
  onValidateCurrentPassword: (password: string) => Promise<{ valid: boolean; error?: string }>;
}

/**
 * SecuritySettings component for managing password and eDepot account linking
 * Provides secure password change and eDepot integration features
 * @param props - Component props containing user data and security handlers
 * @returns JSX element for the security settings interface
 */
export function SecuritySettings({
  user,
  onChangePassword,
  onLinkEDepot,
  onUnlinkEDepot,
  onValidateCurrentPassword,
}: SecuritySettingsProps) {
  const { toast } = useToast();
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [passwordValidation, setPasswordValidation] = useState({
    currentValid: null as boolean | null,
    newPasswordStrength: 0,
    passwordsMatch: true,
  });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isValidatingCurrent, setIsValidatingCurrent] = useState(false);
  
  // eDepot linking state
  const [eDepotForm, setEDepotForm] = useState({
    username: '',
    password: '',
  });
  
  const [isLinkingEDepot, setIsLinkingEDepot] = useState(false);
  const [isUnlinkingEDepot, setIsUnlinkingEDepot] = useState(false);
  const [showEDepotForm, setShowEDepotForm] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^\w\s]/.test(password)) strength += 1;
    return strength;
  };

  // Get password strength info
  const getPasswordStrengthInfo = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { text: 'Rất yếu', color: 'bg-red-500', textColor: 'text-red-600' };
      case 2:
        return { text: 'Yếu', color: 'bg-orange-500', textColor: 'text-orange-600' };
      case 3:
        return { text: 'Trung bình', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
      case 4:
        return { text: 'Mạnh', color: 'bg-blue-500', textColor: 'text-blue-600' };
      case 5:
        return { text: 'Rất mạnh', color: 'bg-green-500', textColor: 'text-green-600' };
      default:
        return { text: '', color: 'bg-gray-300', textColor: 'text-gray-600' };
    }
  };

  // Handle password form changes
  const handlePasswordChange = async (field: string, value: string) => {
    const newForm = { ...passwordForm, [field]: value };
    setPasswordForm(newForm);

    if (field === 'currentPassword' && value) {
      setIsValidatingCurrent(true);
      try {
        const result = await onValidateCurrentPassword(value);
        setPasswordValidation(prev => ({ ...prev, currentValid: result.valid }));
      } catch {
        setPasswordValidation(prev => ({ ...prev, currentValid: false }));
      } finally {
        setIsValidatingCurrent(false);
      }
    }

    if (field === 'newPassword') {
      const strength = calculatePasswordStrength(value);
      setPasswordValidation(prev => ({ 
        ...prev, 
        newPasswordStrength: strength,
        passwordsMatch: value === newForm.confirmPassword || newForm.confirmPassword === ''
      }));
    }

    if (field === 'confirmPassword') {
      setPasswordValidation(prev => ({ 
        ...prev, 
        passwordsMatch: value === newForm.newPassword || value === ''
      }));
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!passwordValidation.currentValid) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu hiện tại không chính xác.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordValidation.newPasswordStrength < 3) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu mới cần có độ mạnh ít nhất là "Trung bình".',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordValidation.passwordsMatch) {
      toast({
        title: 'Lỗi',
        description: 'Xác nhận mật khẩu không khớp.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const result = await onChangePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      if (result.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordValidation({ currentValid: null, newPasswordStrength: 0, passwordsMatch: true });
        toast({
          title: 'Thành công',
          description: 'Đổi mật khẩu thành công.',
        });
      } else {
        throw new Error(result.error || 'Không thể đổi mật khẩu');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đổi mật khẩu.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle eDepot linking
  const handleLinkEDepot = async (event: React.FormEvent) => {
    event.preventDefault();
    
    setIsLinkingEDepot(true);
    
    try {
      const result = await onLinkEDepot(eDepotForm);
      
      if (result.success) {
        setEDepotForm({ username: '', password: '' });
        setShowEDepotForm(false);
        toast({
          title: 'Thành công',
          description: 'Liên kết tài khoản eDepot thành công.',
        });
      } else {
        throw new Error(result.error || 'Không thể liên kết tài khoản eDepot');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi liên kết tài khoản eDepot.',
        variant: 'destructive',
      });
    } finally {
      setIsLinkingEDepot(false);
    }
  };

  // Handle eDepot unlinking
  const handleUnlinkEDepot = async () => {
    setIsUnlinkingEDepot(true);
    
    try {
      const result = await onUnlinkEDepot();
      
      if (result.success) {
        toast({
          title: 'Thành công',
          description: 'Hủy liên kết tài khoản eDepot thành công.',
        });
      } else {
        throw new Error(result.error || 'Không thể hủy liên kết tài khoản eDepot');
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi hủy liên kết tài khoản eDepot.',
        variant: 'destructive',
      });
    } finally {
      setIsUnlinkingEDepot(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa có thông tin';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Không xác định';
    }
  };

  const strengthInfo = getPasswordStrengthInfo(passwordValidation.newPasswordStrength);

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Đổi mật khẩu</span>
          </CardTitle>
          <CardDescription>
            Cập nhật mật khẩu để bảo mật tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Mật khẩu hiện tại *</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={passwordVisibility.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className={cn(
                    passwordValidation.currentValid === false && 'border-red-500',
                    passwordValidation.currentValid === true && 'border-green-500'
                  )}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setPasswordVisibility(prev => ({ ...prev, current: !prev.current }))}
                >
                  {passwordVisibility.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Validation indicator */}
                {passwordForm.currentPassword && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    {isValidatingCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : passwordValidation.currentValid === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : passwordValidation.currentValid === false ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới *</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={passwordVisibility.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setPasswordVisibility(prev => ({ ...prev, new: !prev.new }))}
                >
                  {passwordVisibility.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Password strength indicator */}
              {passwordForm.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn('h-2 rounded-full transition-all', strengthInfo.color)}
                        style={{ width: `${(passwordValidation.newPasswordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-medium', strengthInfo.textColor)}>
                      {strengthInfo.text}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới *</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={passwordVisibility.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className={cn(
                    !passwordValidation.passwordsMatch && passwordForm.confirmPassword && 'border-red-500'
                  )}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setPasswordVisibility(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {passwordVisibility.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {!passwordValidation.passwordsMatch && passwordForm.confirmPassword && (
                <p className="text-xs text-red-600">Mật khẩu xác nhận không khớp.</p>
              )}
            </div>

            {/* Last password change info */}
            {user.last_password_change && (
              <div className="text-xs text-muted-foreground">
                Lần đổi mật khẩu cuối: {formatDate(user.last_password_change)}
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isChangingPassword || !passwordValidation.currentValid || passwordValidation.newPasswordStrength < 3 || !passwordValidation.passwordsMatch}
              className="w-full"
            >
              {isChangingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              {isChangingPassword ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}