'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Container, 
  FileText, 
  Building2, 
  Plus,
  BarChart3,
  MapPin,
  RefreshCw,
  Truck
} from 'lucide-react'

interface GlobalSearchCommandProps {
  userRole?: 'DISPATCHER' | 'CARRIER_ADMIN' | string
}

export default function GlobalSearchCommand({ userRole = 'DISPATCHER' }: GlobalSearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Quick actions based on user role
  const getQuickActions = () => {
    if (userRole === 'DISPATCHER') {
      return [
        {
          label: 'Thêm Lệnh Giao Trả',
          description: 'Tạo lệnh giao trả container mới',
          icon: Plus,
          action: () => router.push('/dispatcher?action=add-import'),
          keywords: ['tạo', 'thêm', 'lệnh', 'giao', 'trả', 'import', 'container']
        },
        {
          label: 'Thêm Lệnh Lấy Rỗng',
          description: 'Tạo booking lấy container rỗng',
          icon: Truck,
          action: () => router.push('/dispatcher?action=add-export'),
          keywords: ['tạo', 'thêm', 'booking', 'lấy', 'rỗng', 'export']
        },
        {
          label: 'Xem Gợi Ý Ghép Nối',
          description: 'Tìm cơ hội tái sử dụng container',
          icon: RefreshCw,
          action: () => router.push('/dispatcher#suggestions'),
          keywords: ['gợi', 'ý', 'ghép', 'nối', 'suggestions', 'match']
        },
        {
          label: 'Đi đến Thị trường',
          description: 'Xem container marketplace',
          icon: Search,
          action: () => router.push('/marketplace'),
          keywords: ['thị', 'trường', 'marketplace', 'container']
        }
      ]
    } else if (userRole === 'CARRIER_ADMIN') {
      return [
        {
          label: 'Xem Yêu cầu Chờ duyệt',
          description: 'Danh sách yêu cầu cần xử lý',
          icon: RefreshCw,
          action: () => router.push('/carrier-admin?tab=street-turn'),
          keywords: ['yêu', 'cầu', 'chờ', 'duyệt', 'pending']
        },
        {
          label: 'Quản lý Quy tắc Tự động',
          description: 'Cấu hình auto-approval rules',
          icon: BarChart3,
          action: () => router.push('/carrier-admin/rules'),
          keywords: ['quy', 'tắc', 'tự', 'động', 'rules', 'auto']
        },
        {
          label: 'Xem Yêu cầu COD',
          description: 'Quản lý change of delivery',
          icon: MapPin,
          action: () => router.push('/carrier-admin?tab=cod'),
          keywords: ['cod', 'change', 'delivery', 'đổi', 'nơi', 'trả']
        },
        {
          label: 'Báo cáo Dashboard',
          description: 'Xem thống kê hiệu suất',
          icon: BarChart3,
          action: () => router.push('/reports'),
          keywords: ['báo', 'cáo', 'dashboard', 'thống', 'kê']
        }
      ]
    }
    return []
  }

  const quickActions = getQuickActions()

  // Navigation items
  const navigationItems = [
    {
      label: 'Dashboard',
      description: 'Trang chủ và thống kê',
      icon: BarChart3,
      action: () => router.push('/reports'),
      keywords: ['dashboard', 'trang', 'chủ', 'thống', 'kê']
    },
    {
      label: 'Dispatcher',
      description: 'Quản lý lệnh giao trả và lấy rỗng',
      icon: Container,
      action: () => router.push('/dispatcher'),
      keywords: ['dispatcher', 'điều', 'phối', 'lệnh'],
      show: userRole === 'DISPATCHER'
    },
    {
      label: 'Carrier Admin',
      description: 'Quản lý yêu cầu hãng tàu',
      icon: Building2,
      action: () => router.push('/carrier-admin'),
      keywords: ['carrier', 'admin', 'hãng', 'tàu'],
      show: userRole === 'CARRIER_ADMIN'
    },
    {
      label: 'Marketplace',
      description: 'Thị trường container',
      icon: Search,
      action: () => router.push('/marketplace'),
      keywords: ['marketplace', 'thị', 'trường']
    }
  ].filter(item => item.show !== false)

  // Filter items based on search
  const filteredActions = quickActions.filter(action => 
    !search || 
    action.label.toLowerCase().includes(search.toLowerCase()) ||
    action.description.toLowerCase().includes(search.toLowerCase()) ||
    action.keywords.some(keyword => keyword.toLowerCase().includes(search.toLowerCase()))
  )

  const filteredNavigation = navigationItems.filter(item => 
    !search || 
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.keywords.some(keyword => keyword.toLowerCase().includes(search.toLowerCase()))
  )

  // Check if search looks like container number or booking number
  const isContainerSearch = search.match(/^[A-Z]{3,4}[UJZ][0-9]{6,7}$/i)
  const isBookingSearch = search.match(/^[A-Z]{2,4}[0-9]{4,8}$/i)

  const runCommand = (action: () => void) => {
    action()
    setOpen(false)
    setSearch('')
  }

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative w-full justify-start text-sm text-muted-foreground hover:bg-primary/5 hover:border-primary/30 transition-colors"
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Tìm container, booking, hoặc hành động...</span>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>        
        <CommandList className="max-h-[400px] overflow-y-auto p-2">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <CommandGroup heading="Hành động nhanh" className="p-0 mb-3">
              {filteredActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <CommandItem
                    key={index}
                    onSelect={() => runCommand(action.action)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{action.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}

          {/* Navigation */}
          {filteredNavigation.length > 0 && (
            <>
              {filteredActions.length > 0 && <CommandSeparator className="my-2" />}
              <CommandGroup heading="Điều hướng" className="p-0 mb-3">
                {filteredNavigation.map((item, index) => {
                  const IconComponent = item.icon
                  return (
                    <CommandItem
                      key={index}
                      onSelect={() => runCommand(item.action)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer transition-all"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                        <IconComponent className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{item.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          )}

          {/* Container/Booking Search Results */}
          {(isContainerSearch || isBookingSearch) && (
            <>
              <CommandSeparator className="my-2" />
              <CommandGroup heading="Tìm kiếm dữ liệu" className="p-0">
                {isContainerSearch && (
                  <CommandItem 
                    onSelect={() => runCommand(() => router.push(`/search?container=${search}`))}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100">
                      <Container className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">Tìm Container: {search}</span>
                      <span className="text-xs text-muted-foreground">
                        Tìm kiếm trong lệnh giao trả
                      </span>
                    </div>
                  </CommandItem>
                )}
                {isBookingSearch && (
                  <CommandItem 
                    onSelect={() => runCommand(() => router.push(`/search?booking=${search}`))}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary cursor-pointer transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">Tìm Booking: {search}</span>
                      <span className="text-xs text-muted-foreground">
                        Tìm kiếm trong lệnh lấy rỗng
                      </span>
                    </div>
                  </CommandItem>
                )}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
} 