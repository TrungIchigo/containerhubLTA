'use client'

import dynamic from 'next/dynamic'
import MapErrorBoundary from './map-error-boundary'
import type { MarketplaceListing } from '@/lib/types'

const SimpleMap = dynamic(() => import('./simple-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Đang tải bản đồ...</p>
      </div>
    </div>
  )
})

interface DynamicMapProps {
  listings: MarketplaceListing[]
  className?: string
  height?: string
}

export default function DynamicMap(props: DynamicMapProps) {
  return (
    <MapErrorBoundary>
      <SimpleMap {...props} />
    </MapErrorBoundary>
  )
} 