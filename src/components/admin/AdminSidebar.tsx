'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  LogOut,
  Shield,
  Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const adminNavItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    label: 'Tổ chức chờ duyệt',
    href: '/admin/organizations/pending',
    icon: Building2
  },
  {
    label: 'Tất cả tổ chức',
    href: '/admin/organizations',
    icon: Users
  },
  {
    label: 'Quản lý Tài chính',
    href: '/admin/billing',
    icon: Receipt
  },
  {
    label: 'Báo cáo',
    href: '/admin/reports',
    icon: FileText
  },
  {
    label: 'Cài đặt hệ thống',
    href: '/admin/settings',
    icon: Settings
  }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Admin Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">i-ContainerHub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {adminNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
                          (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn(
                'mr-3 h-5 w-5',
                isActive ? 'text-blue-700' : 'text-gray-400'
              )} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/login">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-gray-700 hover:text-gray-900"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Đăng xuất
          </Button>
        </Link>
      </div>
    </div>
  )
}