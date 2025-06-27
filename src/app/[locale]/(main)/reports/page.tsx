import { Suspense } from 'react'
import { getDashboardStats, getDashboardTrendData } from '@/lib/actions/dashboard'
import KPICards from '@/components/dashboard/KPICards'
import TimeFilter from '@/components/dashboard/TimeFilter'
import DashboardCharts from '@/components/dashboard/DashboardCharts'

interface ReportsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function ReportsContent({ searchParams }: ReportsPageProps) {
  const params = await searchParams
  
  // Extract and validate search parameters
  const range = typeof params.range === 'string' ? params.range : 'month'
  const start_date = typeof params.start_date === 'string' ? params.start_date : undefined
  const end_date = typeof params.end_date === 'string' ? params.end_date : undefined

  try {
    // Fetch dashboard data in parallel
    const [dashboardStats, trendData] = await Promise.all([
      getDashboardStats({ range, start_date, end_date }),
      getDashboardTrendData({ range, start_date, end_date })
    ])

    return (
      <>
        {/* KPI Cards Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-h2 font-semibold text-text-primary">
                Chỉ Số Hiệu Suất Chính
              </h2>
              <p className="text-body text-text-secondary">
                Tổng quan về hiệu quả hoạt động từ {dashboardStats.date_range.start_date} đến {dashboardStats.date_range.end_date}
              </p>
            </div>
            
            {/* Time Filter moved here */}
            <TimeFilter />
          </div>
          
          <KPICards kpis={dashboardStats.summary} />
        </div>

        {/* Charts Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-h2 font-semibold text-text-primary">
              Biểu Đồ Trực Quan
            </h2>
            <p className="text-body text-text-secondary">
              Xu hướng và phân tích chi tiết
            </p>
          </div>
          
          <DashboardCharts 
            trendData={trendData.trend_data}
            statusDistribution={trendData.status_distribution}
          />
        </div>

        {/* Summary Information */}
        <div className="card">
          <h3 className="text-h3 font-semibold text-text-primary mb-3">
            Thông Tin Tổng Quan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary-light rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {dashboardStats.summary.total_requests}
              </div>
              <div className="text-body-small text-text-secondary">
                Tổng số yêu cầu
              </div>
            </div>
            <div className="text-center p-4 bg-accent-light rounded-lg">
              <div className="text-2xl font-bold text-accent mb-1">
                {dashboardStats.summary.pending_requests}
              </div>
              <div className="text-body-small text-text-secondary">
                Đang chờ xử lý
              </div>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="text-2xl font-bold text-text-primary mb-1">
                {dashboardStats.organization_role === 'TRUCKING_COMPANY' ? 'Điều phối viên' : 'Quản trị viên'}
              </div>
              <div className="text-body-small text-text-secondary">
                Vai trò của bạn
              </div>
            </div>
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error('Error loading dashboard:', error)
    return (
      <div className="card text-center py-8">
        <p className="text-danger text-body mb-2">
          Có lỗi xảy ra khi tải dữ liệu dashboard
        </p>
        <p className="text-body-small text-text-secondary">
          Vui lòng thử lại sau hoặc liên hệ hỗ trợ
        </p>
      </div>
    )
  }
}

function LoadingSkeleton() {
  return (
    <>
      {/* KPI Cards Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* Time Filter Skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="kpi-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Skeleton */}
      <div>
        <div className="mb-4">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="card">
              <div className="mb-4">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="card">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function ReportsPage(props: ReportsPageProps) {
  return (
    <div className="container-spacing">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-h1 font-bold text-text-primary mb-2">
          Báo cáo hiệu quả hoạt động
        </h1>
        <p className="text-body text-text-secondary">
          Tổng quan về hiệu suất và giá trị mà Hệ Thống Tái Sử Dụng Container i-ContainerHub@LTA mang lại
        </p>
      </div>

      {/* Content with Suspense for loading state */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ReportsContent {...props} />
      </Suspense>
    </div>
  )
} 