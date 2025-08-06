import { Container, Clock, CheckCircle } from 'lucide-react'

interface KPICardsInlineProps {
  availableContainers: number
  availableBookings: number
  approvedStreetTurns: number
}

export default function KPICardsInline({ 
  availableContainers, 
  availableBookings, 
  approvedStreetTurns 
}: KPICardsInlineProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Container Sẵn Sàng */}
      <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Container className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-blue-100 text-xs font-medium uppercase tracking-wide">Container Sẵn Sàng</div>
            <div className="text-2xl font-bold">{availableContainers}</div>
          </div>
        </div>
      </div>

      {/* Booking Đang Chờ */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-orange-100 text-xs font-medium uppercase tracking-wide">Booking Đang Chờ</div>
            <div className="text-2xl font-bold">{availableBookings}</div>
          </div>
        </div>
      </div>

      {/* Re-use Đã Duyệt */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Re-use Đã Duyệt</div>
            <div className="text-2xl font-bold">{approvedStreetTurns}</div>
          </div>
        </div>
      </div>
    </div>
  )
}