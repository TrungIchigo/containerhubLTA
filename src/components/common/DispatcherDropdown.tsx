'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronUp, Truck, Box, ArrowDownUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DispatcherDropdownProps {
  isActive: boolean
}

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function DispatcherDropdown({ isActive }: DispatcherDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Tự động mở dropdown khi có menu item được chọn
  useEffect(() => {
    const menuItems = [
      '/dispatcher/dropoff-orders',
      '/dispatcher/pickup-orders',
      '/dispatcher/suggestions'
    ]
    if (pathname && menuItems.some(path => pathname.startsWith(path))) {
      setIsOpen(true)
    }
  }, [pathname])

  const menuItems: MenuItem[] = [
    {
      name: 'Lệnh giao trả',
      href: '/dispatcher/dropoff-orders',
      icon: Truck,
    },
    {
      name: 'Lệnh lấy rỗng',
      href: '/dispatcher/pickup-orders',
      icon: Box,
    },
    {
      name: 'Gợi ý Re-use',
      href: '/dispatcher/suggestions',
      icon: ArrowDownUp,
    }
  ]

  return (
    <div>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-button text-sm font-medium transition-all duration-200 group ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-button'
            : 'text-secondary-light hover:bg-secondary-light/10 hover:text-secondary-foreground'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Truck className={`w-4 h-4 ${
            isActive ? 'text-primary-foreground' : 'text-secondary-light group-hover:text-secondary-foreground'
          }`} />
          <span>Bảng Điều Phối</span>
        </div>
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden bg-secondary-dark/50"
          >
            <div className="py-1 space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon
                const isItemActive = pathname?.startsWith(item.href)
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-start space-x-3 px-6 py-2 text-sm transition-all duration-200
                      ${isItemActive 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-secondary-light hover:bg-secondary-light/5 hover:text-secondary-foreground'
                      }`}
                  >
                    <IconComponent className={`w-4 h-4 mt-0.5 ${
                      isItemActive ? 'text-primary' : 'text-secondary-light'
                    }`} />
                    <div>
                      <div className={isItemActive ? 'font-medium' : ''}>{item.name}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}