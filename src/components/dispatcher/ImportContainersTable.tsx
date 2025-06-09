import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AddImportContainerForm from './AddImportContainerForm'
import type { ImportContainer, Organization } from '@/lib/types'

interface ImportContainersTableProps {
  containers: (ImportContainer & {
    shipping_line?: Organization
  })[]
  shippingLines: Organization[]
}

export default function ImportContainersTable({ 
  containers, 
  shippingLines 
}: ImportContainersTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="approved">Sẵn sàng</Badge>
      case 'AWAITING_APPROVAL':
        return <Badge variant="pending">Chờ duyệt</Badge>
      case 'CONFIRMED':
        return <Badge variant="confirmed">Đã xác nhận</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="card mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-h3 text-text-primary">Quản lý Container Nhập Khẩu</CardTitle>
          <p className="text-body-small text-text-secondary mt-1">
            Tổng cộng: {containers.length} container
          </p>
        </div>
        <AddImportContainerForm shippingLines={shippingLines} />
      </CardHeader>
      
      <CardContent>
        {containers.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <p className="text-body">Chưa có container nhập khẩu nào.</p>
            <p className="text-body-small mt-2">Hãy thêm container đầu tiên để bắt đầu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">Số Container</th>
                  <th className="table-header">Loại</th>
                  <th className="table-header">Hãng Tàu</th>
                  <th className="table-header">Địa Điểm Dỡ Hàng</th>
                  <th className="table-header">Thời Gian Rảnh</th>
                  <th className="table-header text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((container) => (
                  <tr key={container.id} className="table-row">
                    <td className="table-cell">
                      <div className="text-label text-text-primary">
                        {container.container_number}
                      </div>
                    </td>
                    <td className="table-cell">
                      <Badge variant="outline">
                        {container.container_type}
                      </Badge>
                    </td>
                    <td className="table-cell text-text-secondary">
                      {container.shipping_line?.name || 'N/A'}
                    </td>
                    <td className="table-cell text-text-secondary">
                      {container.drop_off_location}
                    </td>
                    <td className="table-cell text-text-secondary">
                      {formatDateTime(container.available_from_datetime)}
                    </td>
                    <td className="table-cell text-center">
                      {getStatusBadge(container.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 