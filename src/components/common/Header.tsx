'use client'

import UserNav from './UserNav'

export default function Header() {
  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">i-ContainerHub@LTA</h1>
        </div>
        <UserNav />
      </div>
    </header>
  )
} 