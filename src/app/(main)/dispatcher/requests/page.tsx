import { Suspense } from 'react'
import { getStreetTurnRequests } from '@/lib/actions/requests'
import { getCodRequests } from '@/lib/actions/cod'
import { getCurrentUser } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RequestFilters from '@/components/features/dispatcher/RequestFilters'
import RequestHistoryTable from '@/components/features/dispatcher/RequestHistoryTable'
import CodRequestsTable from '@/components/features/cod/CodRequestsTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, MapPin } from 'lucide-react'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { ErrorSection } from '@/components/common/RetryButton'

interface RequestsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function RequestsContent({ searchParams }: RequestsPageProps) {
  const params = await searchParams
  
  // Extract and validate search parameters
  const search = typeof params.search === 'string' ? params.search : undefined
  const status = typeof params.status === 'string' && 
    ['PENDING', 'APPROVED', 'DECLINED'].includes(params.status) 
    ? params.status as 'PENDING' | 'APPROVED' | 'DECLINED' 
    : undefined

  try {
    console.log('Loading requests with filters:', { search, status })

    // Fetch both street-turn and COD requests with individual error handling
    let streetTurnRequests: any[] = []
    let codRequests: any[] = []
    let streetTurnError: string | null = null
    let codError: string | null = null

    // Try to fetch street-turn requests
    try {
      streetTurnRequests = await getStreetTurnRequests({ search, status })
      console.log('Street-turn requests loaded:', streetTurnRequests.length)
    } catch (error: any) {
      console.error('Failed to load street-turn requests:', error)
      streetTurnError = error.message
    }

    // Try to fetch COD requests
    try {
      codRequests = await getCodRequests()
      console.log('COD requests loaded:', codRequests.length)
    } catch (error: any) {
      console.error('Failed to load COD requests:', error)
      codError = error.message
    }

    // Get current user to fetch their reviews
    const user = await getCurrentUser()
    let userReviews: string[] = []
    
    if (user?.profile?.organization_id) {
      try {
        const supabase = await createClient()
        const { data: reviews } = await supabase
          .from('partner_reviews')
          .select('request_id')
          .eq('reviewer_org_id', user.profile.organization_id)
        
        userReviews = reviews?.map(review => review.request_id) || []
      } catch (error) {
        console.error('Failed to load user reviews:', error)
        // Continue without reviews - non-critical feature
      }
    }

    return (
      <Tabs defaultValue="street-turn" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="street-turn" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Yêu cầu Re-use
            {streetTurnError && (
              <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" title="Có lỗi khi tải dữ liệu" />
            )}
          </TabsTrigger>
          <TabsTrigger value="cod" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Yêu cầu Đổi Nơi Trả (COD)
            {codError && (
              <span className="ml-1 w-2 h-2 bg-red-500 rounded-full" title="Có lỗi khi tải dữ liệu" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="street-turn" className="space-y-6">
          {streetTurnError ? (
            <ErrorSection title="Không thể tải danh sách yêu cầu Re-use" error={streetTurnError} />
          ) : (
            <>
              {/* Filters Section */}
              <div className="card">
                <RequestFilters />
              </div>

              {/* Results Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-h3 font-semibold text-text-primary">
                    Lịch sử Yêu Cầu Re-use
                  </h2>
                  <span className="text-body-small text-text-secondary">
                    {streetTurnRequests.length} yêu cầu{search || status ? ' (đã lọc)' : ''}
                  </span>
                </div>
                
                <RequestHistoryTable requests={streetTurnRequests} userReviews={userReviews} />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="cod" className="space-y-6">
          {codError ? (
            <ErrorSection title="Không thể tải danh sách yêu cầu Thay Đổi Địa Điểm" error={codError} />
          ) : (
            <CodRequestsTable requests={codRequests} />
          )}
        </TabsContent>
      </Tabs>
    )
  } catch (error: any) {
    console.error('Critical error loading requests page:', error)
    return <ErrorBoundary error={error} />
  }
}

// Loading component
function RequestsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="card">
        <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}

export default async function RequestsPage(props: RequestsPageProps) {
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
    <DispatcherDashboardWrapper userOrgId={user.profile?.organization_id || ''}>
      <div className="container-spacing">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-h1 font-bold text-text-primary mb-2">
            Quản lý Yêu Cầu Re-use
          </h1>
          <p className="text-body text-text-secondary">
            Xem lại và theo dõi tất cả các yêu cầu Re-use container đã gửi của công ty bạn
          </p>
        </div>

        {/* Content with Suspense for loading state */}
        <Suspense fallback={<RequestsLoading />}>
          <RequestsContent {...props} />
        </Suspense>
      </div>
    </DispatcherDashboardWrapper>
  )
}

export const dynamic = 'force-dynamic'