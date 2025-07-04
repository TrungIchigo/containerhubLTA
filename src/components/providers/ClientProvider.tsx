'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'

interface ClientProviderProps {
  messages: any
  locale: string
  children: ReactNode
}

export function ClientProvider({ messages, locale, children }: ClientProviderProps) {
  return (
    <NextIntlClientProvider 
      messages={messages} 
      locale={locale}
      timeZone="Asia/Ho_Chi_Minh"
    >
      {children}
    </NextIntlClientProvider>
  )
} 