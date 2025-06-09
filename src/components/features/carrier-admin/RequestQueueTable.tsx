'use client'

export default function RequestQueueTable() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Các yêu cầu Street-Turn đang chờ phê duyệt
      </p>
      
      <div className="border border-border rounded-lg p-4">
        <div className="grid grid-cols-7 gap-4 text-sm font-medium text-muted-foreground border-b pb-2 mb-4">
          <div>Container</div>
          <div>Booking</div>
          <div>Công ty VT</div>
          <div>Tiết kiệm ước tính</div>
          <div>CO2 giảm</div>
          <div>Ngày tạo</div>
          <div>Hành động</div>
        </div>
        
        <div className="text-center py-8 text-muted-foreground">
          Không có yêu cầu chờ phê duyệt
        </div>
      </div>
    </div>
  )
} 