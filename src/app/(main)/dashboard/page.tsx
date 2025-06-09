export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan hiệu quả Street-Turn</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Tổng tiết kiệm</h3>
          <p className="text-3xl font-bold text-primary">$0</p>
          <p className="text-sm text-muted-foreground">Tháng này</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">CO2 giảm thiểu</h3>
          <p className="text-3xl font-bold text-green-600">0 kg</p>
          <p className="text-sm text-muted-foreground">Tháng này</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Street-Turns</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-muted-foreground">Hoàn thành</p>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Hoạt động gần đây</h2>
        <p className="text-muted-foreground">Chưa có hoạt động nào</p>
      </div>
    </div>
  )
} 