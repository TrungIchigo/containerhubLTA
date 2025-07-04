import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'i-ContainerHub@LTA',
  description: 'Hệ thống tối ưu hóa logistics container thông qua hoạt động tái sử dụng container.',
  icons: {
    icon: 'https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets/logo.png',
    shortcut: 'https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets/logo.png',
    apple: 'https://uelfhngfhiirnxinvtbg.supabase.co/storage/v1/object/public/assets/logo.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 