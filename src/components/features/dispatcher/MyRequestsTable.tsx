'use client'

export default function MyRequestsTable() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Danh sách các yêu cầu Street-Turn đã gửi
      </p>
      
      <div className="border border-border rounded-lg p-4">
        <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2 mb-4">
          <div>Container</div>
          <div>Booking</div>
          <div>Hãng tàu</div>
          <div>Trạng thái</div>
          <div>Tiết kiệm</div>
          <div>Ngày tạo</div>
        </div>
        
        <div className="text-center py-8 text-muted-foreground">
          Chưa có yêu cầu nào
        </div>
      </div>
    </div>
  )
} 