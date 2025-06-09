import RequestQueueTable from '@/components/features/carrier-admin/RequestQueueTable'

export default function CarrierAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản Trị Hãng Tàu</h1>
        <p className="text-muted-foreground">Xem và phê duyệt yêu cầu Street-Turn</p>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Yêu Cầu Chờ Phê Duyệt</h2>
        <RequestQueueTable />
      </div>
    </div>
  )
} 