import { Suspense } from 'react'
import { getMarketplaceListings, getShippingLinesForFilter } from '@/lib/actions/marketplace'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import MarketplaceFilters from '@/components/features/marketplace/MarketplaceFilters'
import MarketplaceListingsTable from '@/components/features/marketplace/MarketplaceListingsTable'
import DynamicMap from '@/components/ui/dynamic-map'
import { Store, Filter, Map, Recycle } from 'lucide-react'
import type { MarketplaceFilters as MarketplaceFiltersType } from '@/lib/types'

interface MarketplacePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function MarketplaceContent({ searchParams }: MarketplacePageProps) {
  const params = await searchParams
  
  // Extract and validate search parameters
  const filters: MarketplaceFiltersType = {
    container_type: typeof params.container_type === 'string' ? params.container_type : undefined,
    shipping_line_name: typeof params.shipping_line_name === 'string' ? params.shipping_line_name : undefined,
    location: typeof params.location === 'string' ? params.location : undefined,
    max_distance_km: typeof params.max_distance_km === 'string' ? parseInt(params.max_distance_km) : undefined,
    min_rating: typeof params.min_rating === 'string' ? parseInt(params.min_rating) : undefined,
    start_date: typeof params.start_date === 'string' ? params.start_date : undefined,
    end_date: typeof params.end_date === 'string' ? params.end_date : undefined
  }

  try {
    // Fetch marketplace listings with filters and shipping lines in parallel
    const [listings, shippingLines] = await Promise.all([
      getMarketplaceListings(filters),
      getShippingLinesForFilter()
    ])

    return (
      <>
        {/* Filters Section */}
        <div className="card relative z-30">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-h3 font-semibold text-text-primary">
              Bộ Lọc Tìm Kiếm
            </h2>
          </div>
          <MarketplaceFilters shippingLines={shippingLines} />
        </div>

        {/* Results Section */}
        <div className="relative z-20">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Recycle className="w-5 h-5 text-green-600" />
                <h2 className="text-h3 font-semibold text-text-primary">
                  Cơ Hội Re-use Container
                </h2>
              </div>
              <span className="text-body-small text-text-secondary">
                {listings.length} cơ hội{Object.values(filters).some(v => v) ? ' (đã lọc)' : ''}
              </span>
            </div>
            
            <MarketplaceListingsTable listings={listings} />
          </div>
        </div>

        {/* Map Section */}
        <div className="card relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Map className="w-5 h-5 text-primary" />
            <h2 className="text-h3 font-semibold text-text-primary">
              Bản Đồ Địa Điểm
            </h2>
          </div>
          <DynamicMap listings={listings} height="400px" />
        </div>
      </>
    )
  } catch (error) {
    console.error('Error loading marketplace listings:', error)
    return (
      <div className="card text-center py-8">
        <p className="text-danger">
          Có lỗi xảy ra khi tải dữ liệu thị trường. Vui lòng thử lại.
        </p>
      </div>
    )
  }
}

function LoadingSkeleton() {
  return (
    <>
      {/* Filter skeleton */}
      <div className="card relative z-30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="relative z-20">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Container</th>
                  <th className="table-header">Công ty</th>
                  <th className="table-header">Hãng tàu</th>
                  <th className="table-header">Địa điểm</th>
                  <th className="table-header">Thời gian</th>
                  <th className="table-header">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell">
                      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Map skeleton */}
      <div className="card relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </>
  )
}

export default async function MarketplacePage(props: MarketplacePageProps) {
  // Authentication and role check
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  if (user.profile?.role !== 'DISPATCHER') {
    // Redirect to appropriate page based on role
    if (user.profile?.role === 'CARRIER_ADMIN') {
      redirect('/carrier-admin')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <div className="container-spacing">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-h1 font-bold text-text-primary">
              Thị Trường Re-use Container
            </h1>
            <p className="text-body text-text-secondary">
              Khám phá các cơ hội ghép nối với lệnh giao trả từ các công ty khác
            </p>
          </div>
        </div>
      </div>

      {/* Content with Suspense for loading state */}
      <Suspense fallback={<LoadingSkeleton />}>
        <MarketplaceContent {...props} />
      </Suspense>
    </div>
  )
}

export const dynamic = 'force-dynamic'