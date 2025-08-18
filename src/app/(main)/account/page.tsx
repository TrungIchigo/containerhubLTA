'use client';

import { useState, useEffect } from 'react';
import { getUserComprehensiveData } from '@/lib/actions/account';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ProfileSidebar } from '@/components/features/account/ProfileSidebar';
import { AccountDetails } from '@/components/features/account/AccountDetails';
import { OrganizationDetails } from '@/components/features/account/OrganizationDetails';
import { SecuritySettings } from '@/components/features/account/SecuritySettings';

interface UserData {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone_number?: string;
    avatar_url?: string;
    role: string;
    edepot_linked?: boolean;
    edepot_username?: string;
  };
  organization: {
    id: string;
    name: string;
    type: string;
    created_at: string;
  } | null;
}

type ActiveSection = 'profile' | 'organization' | 'security';

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');
  
  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      const result = await getUserComprehensiveData();
      
      if (result.success && result.data) {
        setUserData(result.data);
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi tải thông tin người dùng');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Có lỗi xảy ra khi tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDataUpdate = () => {
    fetchUserData();
  };



  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không thể tải thông tin tài khoản</h1>
          <p className="text-gray-600">Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <AccountDetails 
            user={userData.user}
            onUpdateProfile={async (data) => {
              // TODO: Implement profile update
              return { success: false, error: 'Not implemented yet' };
            }}
            onUploadAvatar={async (file) => {
              // TODO: Implement avatar upload
              return { success: false, error: 'Not implemented yet' };
            }}
          />
        );
      case 'organization':
        return (
          <OrganizationDetails 
            organization={userData.organization}
            userRole={userData.user.role}
          />
        );
      case 'security':
        return (
          <SecuritySettings 
            user={userData.user}
            onChangePassword={async (data) => {
              // TODO: Implement password change
              return { success: false, error: 'Not implemented yet' };
            }}
            onLinkEDepot={async (credentials) => {
              // TODO: Implement eDepot linking
              return { success: false, error: 'Not implemented yet' };
            }}
            onUnlinkEDepot={async () => {
              // TODO: Implement eDepot unlinking
              return { success: false, error: 'Not implemented yet' };
            }}
            onValidateCurrentPassword={async (password) => {
              // TODO: Implement password validation
              return { valid: false, error: 'Not implemented yet' };
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý tài khoản</h1>
        <p className="text-gray-600">Cập nhật thông tin cá nhân và cài đặt bảo mật</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ProfileSidebar 
            user={userData.user}
            organization={userData.organization}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onSignOut={() => {/* TODO: Implement sign out */}}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}