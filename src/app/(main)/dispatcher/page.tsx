import AddImportContainerForm from '@/components/features/dispatcher/AddImportContainerForm'
import AddExportBookingForm from '@/components/features/dispatcher/AddExportBookingForm'
import MatchSuggestions from '@/components/features/dispatcher/MatchSuggestions'
import MyRequestsTable from '@/components/features/dispatcher/MyRequestsTable'

export default function DispatcherPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bảng Điều Phối</h1>
        <p className="text-muted-foreground">Quản lý container và tạo yêu cầu Street-Turn</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Thêm Container Nhập Khẩu</h2>
          <AddImportContainerForm />
        </div>
        
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Thêm Booking Xuất Khẩu</h2>
          <AddExportBookingForm />
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Gợi Ý Ghép Nối</h2>
        <MatchSuggestions />
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Yêu Cầu Của Tôi</h2>
        <MyRequestsTable />
      </div>
    </div>
  )
} 