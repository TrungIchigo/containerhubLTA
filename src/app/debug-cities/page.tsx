import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'

export default async function DebugCitiesPage() {
  // Kiểm tra authentication
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.profile?.role !== 'DISPATCHER') {
    redirect('/dispatcher')
  }

  try {
    const supabase = await createClient()
    
    // Lấy thông tin về 2 city_id cụ thể
    const targetCityIds = [
      'ee5f6580-7f13-4736-a2a7-708f348117e1', // Container city
      '6c3a2c47-f897-4fda-8b2f-fe6780947c74'  // Booking city
    ]
    
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('*')
      .in('id', targetCityIds)
    
    if (citiesError) {
      throw citiesError
    }
    
    // Lấy tất cả cities để xem toàn bộ
    const { data: allCities, error: allCitiesError } = await supabase
      .from('cities')
      .select('*')
      .order('name')
    
    if (allCitiesError) {
      throw allCitiesError
    }
    
    // Lấy thông tin depot
    const { data: depots, error: depotsError } = await supabase
      .from('depots')
      .select('*')
      .in('city_id', targetCityIds)
    
    if (depotsError) {
      throw depotsError
    }

    return (
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold">Debug Cities Data</h1>
        
        {/* Target Cities Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Target Cities (Container vs Booking):</h2>
          {cities && cities.length > 0 ? (
            <div className="space-y-2">
              {cities.map(city => (
                <div key={city.id} className="bg-white p-3 rounded border">
                  <strong>ID:</strong> {city.id}<br/>
                  <strong>Name:</strong> {city.name}<br/>
                  <strong>Is Major City:</strong> {city.is_major_city ? 'Yes' : 'No'}<br/>
                  <strong>Created:</strong> {city.created_at}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">❌ Không tìm thấy cities với ID này</p>
          )}
        </div>

        {/* Depots in those cities */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Depots trong các city này:</h2>
          {depots && depots.length > 0 ? (
            <div className="space-y-2">
              {depots.map(depot => (
                <div key={depot.id} className="bg-white p-3 rounded border">
                  <strong>Name:</strong> {depot.name}<br/>
                  <strong>Address:</strong> {depot.address}<br/>
                  <strong>City ID:</strong> {depot.city_id}<br/>
                  <strong>Coordinates:</strong> {depot.latitude}, {depot.longitude}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-orange-600">⚠️ Không tìm thấy depot nào</p>
          )}
        </div>
        
        {/* All Cities */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Tất cả Cities trong hệ thống:</h2>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-1">
              {allCities?.map(city => (
                <div key={city.id} className="text-sm bg-white p-2 rounded flex justify-between">
                  <span><strong>{city.name}</strong> {city.is_major_city ? '(Major)' : ''}</span>
                  <span className="text-gray-500 font-mono text-xs">{city.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Phân tích:</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Vấn đề:</strong> Container và Booking có city_id khác nhau nhưng đều ở Hải Phòng</p>
            <p><strong>Container location:</strong> "ICD Hoàng Thành, Km 9, đường 356, P. Đông Hải 2, Q. Hải An, Hải Phòng"</p>
            <p><strong>Booking location:</strong> "Khu phi thuế quan và KCN Nam Đình Vũ, Q. Hải An, Hải Phòng"</p>
            <p><strong>Giải pháp khả thi:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Option 1: Update logic để cho phép matching trong cùng major city area</li>
              <li>Option 2: Fix dữ liệu để đảm bảo cùng city_id cho cùng khu vực</li>
              <li>Option 3: Implement distance-based matching thay vì strict city_id</li>
            </ul>
          </div>
        </div>
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