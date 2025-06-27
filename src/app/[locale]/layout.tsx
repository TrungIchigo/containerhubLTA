import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import '../globals.css'

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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 