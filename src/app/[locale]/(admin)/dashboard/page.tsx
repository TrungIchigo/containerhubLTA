import { Suspense } from 'react'
import { getAdminDashboardStats, getPendingOrganizations } from '@/lib/actions/admin'
import { AdminStatsCards } from '@/components/admin/AdminStatsCards'
import { PendingOrganizationsTable } from '@/components/admin/PendingOrganizationsTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Quản lý và phê duyệt các yêu cầu đăng ký tổ chức mới
        </p>
      </div>

      {/* Statistics Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <AdminStatsCardsWrapper />
      </Suspense>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Chờ duyệt</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Đã phê duyệt</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center space-x-2">
            <XCircle className="h-4 w-4" />
            <span>Đã từ chối</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Tổ chức chờ phê duyệt</span>
              </CardTitle>
              <CardDescription>
                Danh sách các tổ chức đã hoàn tất đăng ký và đang chờ phê duyệt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TableSkeleton />}>
                <PendingOrganizationsWrapper />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tổ chức đã phê duyệt</CardTitle>
              <CardDescription>
                Danh sách các tổ chức đã được phê duyệt và đang hoạt động
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Tính năng đang phát triển...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tổ chức đã từ chối</CardTitle>
              <CardDescription>
                Danh sách các tổ chức đã bị từ chối với lý do cụ thể
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Tính năng đang phát triển...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Wrapper component for stats cards with data fetching
async function AdminStatsCardsWrapper() {
  const stats = await getAdminDashboardStats()
  return <AdminStatsCards stats={stats} />
}

// Wrapper component for pending organizations table
async function PendingOrganizationsWrapper() {
  const pendingOrganizations = await getPendingOrganizations()
  return <PendingOrganizationsTable organizations={pendingOrganizations} />
}

// Skeleton components
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
} 