'use client'

export default function MatchSuggestions() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Không có gợi ý Re-use nào. Hãy thêm lệnh giao trả và lệnh lấy rỗng để xem các cơ hội Re-use container.
      </p>
      
      {/* Placeholder for match suggestions table */}
      <div className="border border-border rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground border-b pb-2 mb-4">
          <div>Container</div>
          <div>Booking</div>
          <div>Loại</div>
          <div>Tiết kiệm ước tính</div>
          <div>Hành động</div>
        </div>
        
        <div className="text-center py-8 text-muted-foreground">
          Chưa có dữ liệu
        </div>
      </div>
    </div>
  )
}