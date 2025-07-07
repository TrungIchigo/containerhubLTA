import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import MatchSuggestions from '@/components/dispatcher/MatchSuggestions'
import { getSuggestions } from '@/lib/actions/dispatcher'
import type { MatchSuggestion } from '@/components/dispatcher/types'

export default async function SuggestionsPage() {
  try {
    const suggestions = await getSuggestions() as MatchSuggestion[]
    
    return (
      <div className="container max-w-7xl mx-auto py-6">
          <div className="flex items-center gap-4 mb-6">
          <Link href="/dispatcher" className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
            <div>
            <h1 className="text-2xl font-semibold">Gợi Ý Tái Sử Dụng Tốt Nhất</h1>
          </div>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Đang tải...</div>
              <div className="text-sm text-gray-600">Vui lòng đợi trong giây lát</div>
            </div>
          </div>
        }>
          <MatchSuggestions initialSuggestions={suggestions} />
        </Suspense>
      </div>
  )
  } catch (error: any) {
    console.error('Error loading suggestions:', error)
    return notFound()
  }
} 