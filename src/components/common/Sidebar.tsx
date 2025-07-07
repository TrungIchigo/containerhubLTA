'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BarChart3, Truck, Ship, FileText, Settings, Store, Activity, TrendingUp, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SupportContact from './SupportContact'
import DispatcherDropdown from './DispatcherDropdown'

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles: string[]
  isDropdown?: boolean
}

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeListings: 0
  })
  
  const allNavigation: NavigationItem[] = [
    { name: 'Báo Cáo', href: '/reports', icon: BarChart3, roles: ['DISPATCHER', 'CARRIER_ADMIN'] },
    { name: 'Bảng Điều Phối', href: '/dispatcher', icon: Truck, roles: ['DISPATCHER'], isDropdown: true },
    { name: 'Thị Trường', href: '/marketplace', icon: Store, roles: ['DISPATCHER'] },
    { name: 'Quản lý Yêu Cầu', href: '/dispatcher/requests', icon: FileText, roles: ['DISPATCHER'] },
    { name: 'Thanh Toán', href: '/billing', icon: Receipt, roles: ['DISPATCHER'] },
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
            
            // Load relevant stats based on role
            if (profile.role === 'DISPATCHER') {
              // Load dispatcher stats
              const [requestsResult, listingsResult] = await Promise.all([
                supabase
                  .from('street_turn_requests')
                  .select('id', { count: 'exact', head: true })
                  .eq('pickup_trucking_org_id', user.id),
                supabase
                  .from('import_containers')
                  .select('id', { count: 'exact', head: true })
                  .eq('is_listed_on_marketplace', true)
                  .eq('status', 'AVAILABLE')
              ])
              
              setStats({
                totalRequests: requestsResult.count || 0,
                activeListings: listingsResult.count || 0
              })
            } else if (profile.role === 'CARRIER_ADMIN') {
              // Load carrier admin stats
              const [requestsResult, rulesResult] = await Promise.all([
                supabase
                  .from('street_turn_requests')
                  .select('id', { count: 'exact', head: true })
                  .eq('status', 'PENDING'),
                supabase
                  .from('auto_approval_rules')
                  .select('id', { count: 'exact', head: true })
                  .eq('is_active', true)
              ])
              
              setStats({
                totalRequests: requestsResult.count || 0,
                activeListings: rulesResult.count || 0
              })
            }
          }
        }
      } catch (error) {
        console.error('Error loading user role and stats:', error)
      }
    }

    loadUserRole()
  }, [])

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => 
    !userRole || item.roles.includes(userRole)
  )

  return (
    <aside className="hidden lg:block fixed left-0 top-[73px] bottom-0 w-60 bg-secondary-dark text-secondary-foreground shadow-sm z-40 overflow-y-auto">
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4">
          {/* Quick Stats Section */}
          <div className="mb-6 bg-secondary/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Thống Kê Nhanh</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary-light">
                  {userRole === 'DISPATCHER' ? 'Yêu cầu của tôi' : 'Yêu cầu chờ duyệt'}
                </span>
                <span className="font-semibold text-accent">{stats.totalRequests}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary-light">
                  {userRole === 'DISPATCHER' ? 'Cơ hội khả dụng' : 'Quy tắc đang hoạt động'}
                </span>
                <span className="font-semibold text-accent">{stats.activeListings}</span>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.href || 
                (item.href === '/dispatcher' && (
                  pathname.startsWith('/dispatcher/containers') ||
                  pathname.startsWith('/dispatcher/bookings') ||
                  pathname.startsWith('/dispatcher/street-turns') ||
                  pathname.startsWith('/dispatcher/dropoff-orders') ||
                  pathname.startsWith('/dispatcher/pickup-orders') ||
                  pathname.startsWith('/dispatcher/suggestions')
                )) ||
                (item.href === '/dispatcher/requests' && pathname.startsWith('/dispatcher/requests')) ||
                (item.href === '/carrier-admin/rules' && pathname.startsWith('/carrier-admin/rules')) ||
                (item.href === '/marketplace' && pathname.startsWith('/marketplace')) ||
                (item.href === '/billing' && pathname.startsWith('/billing'))

              if (item.isDropdown) {
                return <DispatcherDropdown key={item.name} isActive={isActive} />
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-button text-sm font-medium transition-all duration-200 group hover:bg-primary/10 hover:text-primary ${
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
        </div>

        {/* Support Contact at bottom */}
        <div className="p-4">
          <SupportContact compact={true} />
        </div>
      </div>
    </aside>
  )
} 