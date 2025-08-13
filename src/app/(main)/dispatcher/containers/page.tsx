import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { getDispatcherDashboardData } from '@/lib/actions/dispatcher'
import { getContainerTypes } from '@/lib/actions/container-types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Container, MapPin, Building2, Truck } from 'lucide-react'
import Link from 'next/link'
import ContainersPageClient from '@/components/features/dispatcher/ContainersPageClient'

export default async function ContainersListPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.profile?.role !== 'DISPATCHER') {
    redirect('/dashboard')
  }

  try {
    const [data, containerTypes] = await Promise.all([
      getDispatcherDashboardData(),
      getContainerTypes()
    ])
    
    const availableContainers = data.importContainers.filter(c => c.status === 'AVAILABLE')

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dispatcher">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Container Lệnh Mới Tạo
              </h1>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Container className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-text-secondary">Tổng Container</p>
                    <p className="text-2xl font-bold text-text-primary">{availableContainers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-text-secondary">Hãng Tàu</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {new Set(availableContainers.map(c => c.shipping_line?.id).filter(Boolean)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-text-secondary">Địa Điểm</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {new Set(availableContainers.map(c => c.city_id)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-text-secondary">Loại Container</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {new Set(availableContainers.map(c => c.container_type)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Containers List with Filters */}
          <ContainersPageClient
            containers={availableContainers}
            containerTypes={containerTypes}
            shippingLines={data.shippingLines}
          />
        </div>
      </div>
    )

  } catch (error) {
    console.error('Error loading containers list:', error)
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Có lỗi xảy ra
          </h1>
          <p className="text-text-secondary mb-6">
            Không thể tải danh sách container. Vui lòng thử lại sau.
          </p>
          <Button asChild>
            <Link href="/dispatcher">Quay lại Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }
}