import { getDispatcherDashboardData } from '@/lib/actions/dispatcher'
import { generateMatchingSuggestions } from '@/lib/utils/dispatcher'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'

export default async function DebugMatchingPage() {
  // Kiểm tra authentication
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.profile?.role !== 'DISPATCHER') {
    redirect('/dispatcher')
  }

  try {
    // Lấy dữ liệu thực từ database
    const data = await getDispatcherDashboardData()
    
    // Tìm container PILU6111141
    const targetContainer = data.importContainers.find(c => 
      c.container_number === 'PILU6111141'
    )
    
    // Tìm booking TESTBKG133
    const targetBooking = data.exportBookings.find(b => 
      b.booking_number === 'TESTBKG133'
    )
    
    // Generate suggestions để kiểm tra
    const matchSuggestions = generateMatchingSuggestions(
      data.importContainers,
      data.exportBookings
    )

    return (
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold">Debug Matching Logic</h1>
        
        {/* Container Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Container PILU6111141:</h2>
          {targetContainer ? (
            <pre className="text-sm bg-white p-2 rounded">
              {JSON.stringify(targetContainer, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">❌ Container PILU6111141 không tìm thấy</p>
          )}
        </div>

        {/* Booking Info */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Booking TESTBKG133:</h2>
          {targetBooking ? (
            <pre className="text-sm bg-white p-2 rounded">
              {JSON.stringify(targetBooking, null, 2)}
            </pre>
          ) : (
            <p className="text-red-600">❌ Booking TESTBKG133 không tìm thấy</p>
          )}
        </div>

        {/* All Available Containers */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Tất cả Container AVAILABLE:</h2>
          <div className="space-y-2">
            {data.importContainers
              .filter(c => c.status === 'AVAILABLE')
              .map(container => (
                <div key={container.id} className="text-sm bg-white p-2 rounded">
                  <strong>{container.container_number}</strong> - 
                  Type: {container.container_type} - 
                  Status: {container.status} - 
                  City: {container.city_id} - 
                  Shipping Line: {container.shipping_line_org_id} - 
                  Available: {container.available_from_datetime}
                </div>
              ))}
          </div>
        </div>

        {/* All Available Bookings */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Tất cả Booking AVAILABLE:</h2>
          <div className="space-y-2">
            {data.exportBookings
              .filter(b => b.status === 'AVAILABLE')
              .map(booking => (
                <div key={booking.id} className="text-sm bg-white p-2 rounded">
                  <strong>{booking.booking_number}</strong> - 
                  Type: {booking.required_container_type} - 
                  Status: {booking.status} - 
                  City: {booking.city_id} - 
                  Shipping Line: {booking.shipping_line_org_id} - 
                  Needed: {booking.needed_by_datetime}
                </div>
              ))}
          </div>
        </div>

        {/* Matching Results */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Kết quả Matching ({matchSuggestions.length} gợi ý):</h2>
          {matchSuggestions.length > 0 ? (
            <div className="space-y-2">
              {matchSuggestions.map((suggestion, index) => (
                <div key={index} className="text-sm bg-white p-2 rounded">
                  <strong>Match {index + 1}:</strong><br/>
                  Container: {suggestion.import_container.container_number}<br/>
                  Booking: {suggestion.export_booking.booking_number}<br/>
                  Est. Savings: ${suggestion.estimated_cost_saving}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-orange-600">⚠️ Không có gợi ý matching nào được tạo</p>
          )}
        </div>

        {/* Manual Check */}
        {targetContainer && targetBooking && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Kiểm tra thủ công điều kiện ghép:</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>1. Status:</strong><br/>
                Container: {targetContainer.status} | Booking: {targetBooking.status}
                {targetContainer.status === 'AVAILABLE' && targetBooking.status === 'AVAILABLE' ? ' ✅' : ' ❌'}
              </div>
              
              <div>
                <strong>2. Trucking Company:</strong><br/>
                Container: {targetContainer.trucking_company_org_id}<br/>
                Booking: {targetBooking.trucking_company_org_id}
                {targetContainer.trucking_company_org_id === targetBooking.trucking_company_org_id ? ' ✅' : ' ❌'}
              </div>
              
              <div>
                <strong>3. Shipping Line:</strong><br/>
                Container: {targetContainer.shipping_line_org_id}<br/>
                Booking: {targetBooking.shipping_line_org_id}
                {targetContainer.shipping_line_org_id === targetBooking.shipping_line_org_id ? ' ✅' : ' ❌'}
              </div>
              
              <div>
                <strong>4. City (TEMPORARILY DISABLED):</strong><br/>
                Container: {targetContainer.city_id}<br/>
                Booking: {targetBooking.city_id}<br/>
                Logic: City check is temporarily disabled for testing<br/>
                Result: PASS - City check skipped ✅
              </div>
              
              <div>
                <strong>5. Container Type:</strong><br/>
                Container: {targetContainer.container_type} (ID: {targetContainer.container_type_id})<br/>
                Booking: {targetBooking.required_container_type} (ID: {targetBooking.container_type_id})
                {((targetContainer.container_type_id && targetBooking.container_type_id && targetContainer.container_type_id === targetBooking.container_type_id) ||
                  (targetContainer.container_type === targetBooking.required_container_type)) ? ' ✅' : ' ❌'}
              </div>
              
              <div>
                <strong>6. Timing:</strong><br/>
                Container Available: {targetContainer.available_from_datetime}<br/>
                Booking Needed: {targetBooking.needed_by_datetime}<br/>
                {(() => {
                  const containerTime = new Date(targetContainer.available_from_datetime)
                  const bookingTime = new Date(targetBooking.needed_by_datetime)
                  const diffHours = (bookingTime.getTime() - containerTime.getTime()) / (1000 * 60 * 60)
                  return `Time gap: ${diffHours.toFixed(1)} hours (min: 2) ${diffHours >= 2 ? '✅' : '❌'}`
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <pre className="mt-4 p-4 bg-red-50 rounded">
          {error instanceof Error ? error.message : 'Unknown error'}
        </pre>
      </div>
    )
  }
} 