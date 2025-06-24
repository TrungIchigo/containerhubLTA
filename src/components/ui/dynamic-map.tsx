'use client'

import dynamic from 'next/dynamic'
import MapErrorBoundary from './map-error-boundary'
import type { MarketplaceListing } from '@/lib/types'

const SimpleMap = dynamic(() => import('./simple-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="loader mx-auto mb-2" style={{
          width: '85px',
          height: '50px',
          '--g1': 'conic-gradient(from 90deg at left 3px top 3px, #0000 90deg, #4CAF50 0)',
          '--g2': 'conic-gradient(from -90deg at bottom 3px right 3px, #0000 90deg, #4CAF50 0)',
          background: 'var(--g1), var(--g1), var(--g1), var(--g2), var(--g2), var(--g2)',
          backgroundPosition: 'left, center, right',
          backgroundRepeat: 'no-repeat',
          animation: 'wave-loader 1s infinite'
        } as React.CSSProperties} />
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