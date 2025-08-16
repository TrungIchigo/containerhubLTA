import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, MapPin, Calendar, Building2, DollarSign, Leaf, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatStoredDateTimeVN } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export default async function StreetTurnsListPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.profile?.role !== 'DISPATCHER') {
    redirect('/dashboard')
  }

  try {
    const supabase = await createClient()
    
    // Get approved street turn requests for this organization (basic query first)
    const { data: approvedRequests, error } = await supabase
      .from('street_turn_requests')
      .select('*')
      .or(`pickup_trucking_org_id.eq.${user.profile.organization_id},dropoff_trucking_org_id.eq.${user.profile.organization_id}`)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching street turn requests:', error)
      throw new Error('Không thể tải dữ liệu street turn requests')
    }

    const streetTurnRequests = approvedRequests || []

    // Get related data separately
    const containerIds = streetTurnRequests.map(req => req.import_container_id).filter(Boolean)
    const bookingIds = streetTurnRequests.map(req => req.export_booking_id).filter(Boolean)
    const orgIds = streetTurnRequests.map(req => req.approving_org_id).filter(Boolean)

    const [{ data: containers }, { data: bookings }, { data: organizations }] = await Promise.all([
      supabase
        .from('import_containers')
        .select('id, container_number, container_type, drop_off_location, available_from_datetime')
        .in('id', containerIds),
      supabase
        .from('export_bookings')
        .select('id, booking_number, required_container_type, pick_up_location, needed_by_datetime')
        .in('id', bookingIds),
      supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds)
    ])

    // Create lookup maps
    const containerMap = Object.fromEntries((containers || []).map(c => [c.id, c]))
    const bookingMap = Object.fromEntries((bookings || []).map(b => [b.id, b]))
    const orgMap = Object.fromEntries((organizations || []).map(o => [o.id, o]))

    // Enhance street turn requests with related data
    const enhancedRequests = streetTurnRequests.map(request => ({
      ...request,
      import_container: containerMap[request.import_container_id] || null,
      export_booking: bookingMap[request.export_booking_id] || null,
      approving_org: orgMap[request.approving_org_id] || null
    }))

    // Calculate statistics
    const totalSavings = enhancedRequests.reduce((sum, req) => sum + (req.estimated_cost_saving || 0), 0)
    const totalCo2Savings = enhancedRequests.reduce((sum, req) => sum + (req.estimated_co2_saving_kg || 0), 0)
    const uniqueShippingLines = new Set(enhancedRequests.map(req => req.approving_org?.name).filter(Boolean)).size

    const statusMap = {
      'PENDING': { text: 'Chờ duyệt Re-use', variant: 'pending-reuse' as const },
      'APPROVED': { text: 'Đang thực hiện Re-use', variant: 'processing-reuse' as const },
      'DECLINED': { text: 'Bị từ chối Re-use', variant: 'declined-reuse' as const },
    }

    const getStatusBadge = (status: string) => {
      const currentStatus = statusMap[status as keyof typeof statusMap] || { text: status, variant: 'outline' as const }
      return <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
    }

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
                Re-use Đã Duyệt
              </h1>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-sm text-text-secondary">Đã Duyệt</p>
                                         <p className="text-2xl font-bold text-text-primary">{enhancedRequests.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-text-secondary">Tiết Kiệm</p>
                    <p className="text-2xl font-bold text-text-primary">${totalSavings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Leaf className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="text-sm text-text-secondary">CO₂ Giảm</p>
                    <p className="text-2xl font-bold text-text-primary">{totalCo2Savings}kg</p>
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
                    <p className="text-2xl font-bold text-text-primary">{uniqueShippingLines}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Hãng Tàu
                  </label>
                  <select className="w-full p-2 border border-border rounded-md bg-white text-sm">
                    <option value="">Tất cả hãng tàu</option>
                    {Array.from(new Set(enhancedRequests.map(req => req.approving_org?.name).filter(Boolean))).map((name, index) => (
                      <option key={index} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Ngày duyệt từ
                  </label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-border rounded-md bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Ngày duyệt đến
                  </label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-border rounded-md bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Tìm kiếm
                  </label>
                  <input 
                    type="text" 
                    placeholder="Container, booking, địa điểm..."
                    className="w-full p-2 border border-border rounded-md bg-white text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Street Turn Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 p-3">
                <CheckCircle className="h-5 w-5" />
                Danh Sách Yêu Cầu Re-use Đã Duyệt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                             {enhancedRequests.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-text-secondary" />
                  <p className="text-lg font-medium mb-2">Chưa có yêu cầu nào được duyệt</p>
                  <p>Tạo yêu cầu Re-use container để bắt đầu tiết kiệm chi phí</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-text-primary">Ghép Nối</th>
                        <th className="text-left p-3 font-medium text-text-primary">Hãng Tàu</th>
                        <th className="text-left p-3 font-medium text-text-primary">Địa Điểm</th>
                        <th className="text-left p-3 font-medium text-text-primary">Thời Gian</th>
                        <th className="text-left p-3 font-medium text-text-primary">Lợi Ích</th>
                        <th className="text-center p-3 font-medium text-text-primary">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedRequests.map((request) => (
                        <tr key={request.id} className="border-b border-border hover:bg-gray-50">
                          <td className="p-3">
                            <div className="space-y-2">
                                                             <div className="flex items-center gap-2">
                                 <div className="text-sm font-medium text-text-primary">
                                   {request.import_container?.container_number || 'N/A'}
                                 </div>
                                 <ArrowRight className="h-3 w-3 text-text-secondary" />
                                 <div className="text-sm font-medium text-text-primary">
                                   {request.export_booking?.booking_number || 'N/A'}
                                 </div>
                               </div>
                               <div className="flex gap-2">
                                 <Badge variant="outline" className="text-xs">
                                   {request.import_container?.container_type || 'N/A'}
                                 </Badge>
                                 <Badge variant="outline" className="text-xs">
                                   {request.export_booking?.required_container_type || 'N/A'}
                                 </Badge>
                               </div>
                            </div>
                          </td>
                                                     <td className="p-3">
                             <div className="text-sm text-text-secondary">
                               {request.approving_org?.name || 'N/A'}
                             </div>
                           </td>
                          <td className="p-3">
                                                         <div className="space-y-1">
                               <div className="text-xs text-text-secondary flex items-center gap-1">
                                 <MapPin className="h-3 w-3" />
                                 Trả: {request.import_container?.drop_off_location || 'N/A'}
                               </div>
                               <div className="text-xs text-text-secondary flex items-center gap-1">
                                 <MapPin className="h-3 w-3" />
                                 Lấy: {request.export_booking?.pick_up_location || 'N/A'}
                               </div>
                             </div>
                          </td>
                          <td className="p-3">
                                                         <div className="space-y-1">
                               <div className="text-xs text-text-secondary">
                                 Rảnh: {request.import_container?.available_from_datetime ? formatStoredDateTimeVN(request.import_container.available_from_datetime) : 'N/A'}
                               </div>
                               <div className="text-xs text-text-secondary">
                                 Cần: {request.export_booking?.needed_by_datetime ? formatStoredDateTimeVN(request.export_booking.needed_by_datetime) : 'N/A'}
                               </div>
                               <div className="text-xs text-text-secondary">
                                 Duyệt: {formatStoredDateTimeVN(request.created_at)}
                               </div>
                             </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {request.estimated_cost_saving && (
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${request.estimated_cost_saving}
                                </div>
                              )}
                              {request.estimated_co2_saving_kg && (
                                <div className="text-xs text-emerald-600 flex items-center gap-1">
                                  <Leaf className="h-3 w-3" />
                                  {request.estimated_co2_saving_kg}kg CO₂
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {getStatusBadge(request.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Error loading street turns list:', error)
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Có lỗi xảy ra
          </h1>
          <p className="text-text-secondary mb-6">
            Không thể tải danh sách Re-use. Vui lòng thử lại sau.
          </p>
          <Button asChild>
            <Link href="/dispatcher">Quay lại Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }
}