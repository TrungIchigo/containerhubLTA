'use client'

import Link from 'next/link'
import Image from 'next/image'
import UserNav from './UserNav'
import { LOGO_URL, APP_CONFIG, ROUTES } from '@/lib/constants'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <Link href={ROUTES.DASHBOARD} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <Image
            src={LOGO_URL}
            alt="i-ContainerHub Logo"
            width={60}
            height={60}
            className="rounded-full"
            priority
          />
          <div>
            <h1 className="text-lg font-bold text-primary">{APP_CONFIG.name}</h1>
            <p className="text-xs text-text-secondary">Logistics Technology Application</p>
          </div>
        </Link>
        <UserNav />
      </div>
    </header>
  )
} 