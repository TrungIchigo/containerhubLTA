'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Truck, Ship, FileText } from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Điều phối', href: '/dispatcher', icon: Truck },
    { name: 'Quản lý Yêu cầu', href: '/dispatcher/requests', icon: FileText },
    { name: 'Quản trị', href: '/carrier-admin', icon: Ship },
  ]

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
          const isActive = pathname === item.href || (item.href === '/dispatcher/requests' && pathname.startsWith('/dispatcher/requests'))
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