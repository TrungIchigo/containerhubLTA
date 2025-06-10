'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BarChart3, Truck, Ship, FileText, Settings, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles: string[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  
  const allNavigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, roles: ['DISPATCHER', 'CARRIER_ADMIN'] },
    { name: 'Bảng Điều Phối', href: '/dispatcher', icon: Truck, roles: ['DISPATCHER'] },
    { name: 'Thị Trường', href: '/marketplace', icon: Store, roles: ['DISPATCHER'] },
    { name: 'Quản lý Yêu Cầu Tái Sử Dụng', href: '/dispatcher/requests', icon: FileText, roles: ['DISPATCHER'] },
    { name: 'Cổng Hãng Tàu', href: '/carrier-admin', icon: Ship, roles: ['CARRIER_ADMIN'] },
    { name: 'Quy tắc Tự động', href: '/carrier-admin/rules', icon: Settings, roles: ['CARRIER_ADMIN'] },
  ]

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            setUserRole(profile.role)
          }
        }
      } catch (error) {
        console.error('Error loading user role:', error)
      }
    }

    loadUserRole()
  }, [])

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => 
    !userRole || item.roles.includes(userRole)
  )

  return (
    <aside className="sidebar w-60 p-4 shadow-card">
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">iC</span>
          </div>
          <div>
            <p className="text-secondary-foreground text-sm font-semibold">ContainerHub</p>
            <p className="text-secondary-light text-xs">LTA Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="space-y-1">
        {navigation.map((item) => {
          const IconComponent = item.icon
          const isActive = pathname === item.href || 
            (item.href === '/dispatcher/requests' && pathname.startsWith('/dispatcher/requests')) ||
            (item.href === '/carrier-admin/rules' && pathname.startsWith('/carrier-admin/rules')) ||
            (item.href === '/marketplace' && pathname.startsWith('/marketplace'))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-2 px-3 py-2 rounded-button text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-button'
                  : 'text-secondary-light hover:bg-secondary-light/10 hover:text-secondary-foreground'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${
                isActive ? 'text-primary-foreground' : 'text-secondary-light group-hover:text-secondary-foreground'
              }`} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
} 