import { Badge } from '@/components/ui/badge'

interface StreetTurnRequest {
  id: string
  container_number?: string
  booking_number?: string
  status: 'PENDING' | 'APPROVED' | 'DECLINED'
  match_type?: 'INTERNAL' | 'MARKETPLACE'
  dropoff_org_approval_status?: 'PENDING' | 'APPROVED' | 'DECLINED'
  created_at: string
  auto_approved_by_rule_id?: string
  carrier_organization?: {
    name: string
  }
  partner_organization?: {
    name: string
  } | null
  import_containers?: {
    container_number: string
    booking_number: string
  }[]
  auto_approval_rule?: {
    name: string
  }
}

interface RequestHistoryTableProps {
  requests: StreetTurnRequest[]
  className?: string
}

// Status mapping cho requests
const statusMap = {
  'PENDING': { text: 'Đang chờ', variant: 'pending' as const },
  'APPROVED': { text: 'Đã duyệt', variant: 'approved' as const },
  'DECLINED': { text: 'Bị từ chối', variant: 'declined' as const },
}

const getStatusBadge = (request: StreetTurnRequest) => {
  const { status, auto_approved_by_rule_id, match_type, dropoff_org_approval_status } = request
  const currentStatus = statusMap[status] || { text: status, variant: 'default' as const }
  
  // Auto approved
  if (status === 'APPROVED' && auto_approved_by_rule_id) {
    return (
      <div className="flex items-center gap-1">
        <Badge variant="approved">Tự động duyệt</Badge>
        <span className="text-xs text-blue-600">🤖</span>
      </div>
    )
  }
  
  // Marketplace requests with partner approval pending
  if (match_type === 'MARKETPLACE' && dropoff_org_approval_status === 'PENDING') {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="pending">Chờ đối tác</Badge>
        <span className="text-xs text-text-secondary">Đợi công ty bán duyệt</span>
      </div>
    )
  }
  
  // Marketplace requests with partner declined
  if (match_type === 'MARKETPLACE' && dropoff_org_approval_status === 'DECLINED') {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="declined">Đối tác từ chối</Badge>
        <span className="text-xs text-text-secondary">Yêu cầu bị hủy</span>
      </div>
    )
  }
  
  return <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatRequestId = (id: string) => {
  // Show first 8 characters of ID for display
  return `req_${id.slice(0, 8)}...`
}

const getContainerBookingInfo = (request: StreetTurnRequest) => {
  // Try to get from import_containers first, then fallback to direct fields
  if (request.import_containers && request.import_containers.length > 0) {
    const container = request.import_containers[0]
    return `${container.container_number} / ${container.booking_number}`
  }
  
  // Fallback to direct fields
  if (request.container_number && request.booking_number) {
    return `${request.container_number} / ${request.booking_number}`
  }
  
  return 'N/A'
}

export default function RequestHistoryTable({ requests, className }: RequestHistoryTableProps) {
  if (!requests || requests.length === 0) {
    return (
      <div className={`card text-center py-8 ${className}`}>
        <p className="text-text-secondary">Không có yêu cầu nào được tìm thấy.</p>
      </div>
    )
  }

  return (
    <div className={`card p-0 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header">Mã Yêu cầu</th>
              <th className="table-header">Container / Booking</th>
              <th className="table-header">Hãng tàu</th>
              <th className="table-header">Đối tác</th>
              <th className="table-header">Ngày gửi</th>
              <th className="table-header">Trạng thái</th>
              <th className="table-header">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="table-row">
                <td className="table-cell">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {formatRequestId(request.id)}
                  </code>
                </td>
                <td className="table-cell">
                  <span className="font-medium">
                    {getContainerBookingInfo(request)}
                  </span>
                </td>
                <td className="table-cell">
                  {request.carrier_organization?.name || 'N/A'}
                </td>
                <td className="table-cell">
                  {request.match_type === 'MARKETPLACE' && request.partner_organization ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{request.partner_organization.name}</span>
                      <Badge variant="secondary" className="text-xs w-fit">
                        Marketplace
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-text-secondary text-sm">Nội bộ</span>
                  )}
                </td>
                <td className="table-cell">
                  {formatDate(request.created_at)}
                </td>
                <td className="table-cell">
                  {getStatusBadge(request)}
                </td>
                <td className="table-cell">
                  <div className="flex space-x-2">
                    <button className="text-primary hover:text-primary-dark text-sm font-medium transition-colors">
                      Xem chi tiết
                    </button>
                    {request.status === 'PENDING' && (
                      <button className="text-danger hover:text-red-600 text-sm font-medium transition-colors">
                        Hủy yêu cầu
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 