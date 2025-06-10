import { Suspense } from 'react'
import { getStreetTurnRequests } from '@/lib/actions/requests'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import RequestFilters from '@/components/features/dispatcher/RequestFilters'
import RequestHistoryTable from '@/components/features/dispatcher/RequestHistoryTable'
import { DispatcherDashboardWrapper } from '@/components/features/dispatcher/DispatcherDashboardWrapper'

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
    // Fetch requests with filters
    const requests = await getStreetTurnRequests({ search, status })

    return (
      <>
        {/* Filters Section */}
        <div className="card">
          <RequestFilters />
        </div>

        {/* Results Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-semibold text-text-primary">
              Lịch sử Yêu Cầu Tái Sử Dụng
            </h2>
            <span className="text-body-small text-text-secondary">
              {requests.length} yêu cầu{search || status ? ' (đã lọc)' : ''}
            </span>
          </div>
          
          <RequestHistoryTable requests={requests} />
        </div>
      </>
    )
  } catch (error) {
    console.error('Error loading requests:', error)
    return (
      <div className="card text-center py-8">
        <p className="text-danger">
          Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.
        </p>
      </div>
    )
  }
}

function LoadingSkeleton() {
  return (
    <>
      {/* Filter skeleton */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse"></div>
          <div className="sm:w-48 h-9 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Table skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Mã Yêu cầu</th>
                  <th className="table-header">Container / Booking</th>
                  <th className="table-header">Hãng tàu</th>
                  <th className="table-header">Ngày gửi</th>
                  <th className="table-header">Trạng thái</th>
                  <th className="table-header">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell">
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    </td>
                    <td className="table-cell">
                      <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
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
            Quản lý Yêu Cầu Tái Sử Dụng
          </h1>
          <p className="text-body text-text-secondary">
            Xem lại và theo dõi tất cả các yêu cầu tái sử dụng container đã gửi của công ty bạn
          </p>
        </div>

        {/* Content with Suspense for loading state */}
        <Suspense fallback={<LoadingSkeleton />}>
          <RequestsContent {...props} />
        </Suspense>
      </div>
    </DispatcherDashboardWrapper>
  )
}

export const dynamic = 'force-dynamic' 