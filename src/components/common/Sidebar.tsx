'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Điều phối', href: '/dispatcher', icon: '🚚' },
    { name: 'Quản trị', href: '/carrier-admin', icon: '🚢' },
  ]

  return (
    <aside className="w-64 bg-muted text-muted-foreground p-6">
      <nav className="space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
} 