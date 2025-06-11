# 🗺️ GEOCODING & MAP INTEGRATION IMPLEMENTATION GUIDE

## 📋 Tổng Quan

Tài liệu này hướng dẫn triển khai tính năng geocoding và hiển thị bản đồ cho hệ thống ContainerHub. Tính năng này cho phép:

- Tự động chuyển đổi địa chỉ thành tọa độ (geocoding)
- Hiển thị các địa điểm giao trả container trên bản đồ tương tác
- Cải thiện trải nghiệm người dùng trong việc tìm kiếm và chọn lựa cơ hội tái sử dụng container

## 🏗️ Kiến Trúc Hệ Thống

### Backend Components
1. **Database Schema**: Thêm cột `latitude` và `longitude` vào bảng `import_containers`
2. **Google Maps Geocoding API**: Tích hợp API để chuyển đổi địa chỉ thành tọa độ
3. **Server Actions**: Cập nhật logic tạo container để tự động geocode

### Frontend Components
1. **Map Component**: Sử dụng React-Leaflet để hiển thị bản đồ
2. **Dynamic Loading**: Xử lý SSR issues với leaflet
3. **Marketplace Integration**: Tích hợp bản đồ vào trang marketplace

## 📂 Cấu Trúc File

```
src/
├── lib/
│   ├── google-maps.ts                  # Google Maps geocoding logic
│   ├── types.ts                        # Updated types với lat/lng
│   └── actions/
│       ├── dispatcher.ts               # Updated với geocoding
│       └── marketplace.ts              # Updated với geocoding data
├── components/
│   └── ui/
│       ├── map-component.tsx           # Core map component
│       └── dynamic-map.tsx             # SSR wrapper
└── app/
    └── (main)/
        └── marketplace/
            └── page.tsx                # Updated với map integration
```

## 🗄️ Database Schema Changes

### Migration Script: `geocoding_migration.sql`

```sql
-- Add geocoding columns to import_containers table
ALTER TABLE public.import_containers 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add comments for the new columns
COMMENT ON COLUMN public.import_containers.latitude IS 'Vĩ độ của địa điểm giao trả.';
COMMENT ON COLUMN public.import_containers.longitude IS 'Kinh độ của địa điểm giao trả.';

-- Create index for efficient geo queries
CREATE INDEX IF NOT EXISTS idx_import_containers_coordinates 
ON public.import_containers(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

## 🔧 Environment Setup

### Google Maps API Key
1. Tạo project tại [Google Cloud Console](https://console.cloud.google.com/)
2. Bật "Geocoding API" trong API Library
3. Tạo API Key trong Credentials
4. Thêm vào `.env.local`:

```bash
GOOGLE_MAPS_API_KEY=AIzaSy...your-actual-key
```

### Package Dependencies
```bash
npm install react-leaflet@4.2.1 leaflet @types/leaflet --save-dev
```

## 💻 Implementation Details

### 1. Google Maps Geocoding Library

```typescript
// src/lib/google-maps.ts
interface GeocodeResult {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=vi`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results[0]) {
      return data.results[0].geometry.location;
    }
    return null;
  } catch (error) {
    console.error("Error during geocoding:", error);
    return null;
  }
}
```

### 2. Database Type Updates

```typescript
// src/lib/types.ts
export interface ImportContainer {
  // ... existing fields
  latitude: number | null
  longitude: number | null
}

export interface MarketplaceListing {
  // ... existing fields
  latitude: number | null
  longitude: number | null
}
```

### 3. Server Action Updates

```typescript
// src/lib/actions/dispatcher.ts
export async function addImportContainer(formData: CreateImportContainerForm) {
  // ... existing validation

  // Geocode the address if coordinates are not provided
  let latitude = formData.latitude
  let longitude = formData.longitude
  
  if (!latitude || !longitude) {
    const coordinates = await geocodeAddress(formData.drop_off_location)
    if (coordinates) {
      latitude = coordinates.lat
      longitude = coordinates.lng
    }
  }

  // Insert with coordinates
  const { error } = await supabase
    .from('import_containers')
    .insert({
      // ... existing fields
      latitude,
      longitude,
    })
}
```

### 4. Map Component

```typescript
// src/components/ui/map-component.tsx
export default function MapComponent({ listings }: { listings: MarketplaceListing[] }) {
  const listingsWithCoords = listings.filter(
    listing => listing.latitude !== null && listing.longitude !== null
  )

  return (
    <MapContainer center={mapCenter} zoom={11}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {listingsWithCoords.map((listing) => (
        <Marker key={listing.id} position={[listing.latitude!, listing.longitude!]}>
          <Popup>
            {/* Container details */}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

### 5. Dynamic Loading (SSR Fix)

```typescript
// src/components/ui/dynamic-map.tsx
const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => <div>Đang tải bản đồ...</div>
})
```

## 🚀 Deployment Steps

### 1. Database Migration
```sql
-- Run the geocoding migration
\i geocoding_migration.sql
```

### 2. Environment Variables
```bash
# Add to .env.local
GOOGLE_MAPS_API_KEY=your_actual_api_key
```

### 3. Install Dependencies
```bash
npm install react-leaflet@4.2.1 leaflet @types/leaflet --save-dev
```

### 4. Build and Deploy
```bash
npm run build
npm run start
```

## 🧪 Testing

### 1. Geocoding Function Test
```javascript
// Test in browser console or create test file
const result = await geocodeAddress("123 Nguyễn Huệ, Quận 1, TP.HCM")
console.log(result) // Should return { lat: 10.xxx, lng: 106.xxx }
```

### 2. Map Display Test
1. Tạo container với địa chỉ có thể geocode được
2. Đánh dấu "Chào bán trên marketplace"
3. Kiểm tra bản đồ trên trang marketplace
4. Verify marker hiển thị đúng vị trí

### 3. Error Handling Test
1. Test với địa chỉ không hợp lệ
2. Test khi Google Maps API key không có
3. Test khi network bị lỗi

## 🔍 Troubleshooting

### Common Issues

#### 1. Map không hiển thị
```
Lỗi: Map container not found
Giải pháp: Đảm bảo đã import CSS của leaflet và sử dụng dynamic import
```

#### 2. Geocoding không hoạt động
```
Lỗi: API key invalid
Giải pháp: 
- Kiểm tra API key trong .env.local
- Đảm bảo đã enable Geocoding API
- Kiểm tra quota và billing
```

#### 3. SSR Error với Leaflet
```
Lỗi: window is not defined
Giải pháp: Sử dụng dynamic import với ssr: false
```

### Debug Commands

```bash
# Check environment variables
echo $GOOGLE_MAPS_API_KEY

# Test geocoding API directly
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Ho+Chi+Minh+City&key=YOUR_API_KEY"

# Check database schema
\d+ import_containers
```

## 📊 Performance Considerations

### 1. Geocoding Optimization
- Cache results để tránh duplicate API calls
- Implement rate limiting
- Use batch geocoding cho bulk operations

### 2. Map Performance
- Limit số markers hiển thị cùng lúc
- Implement clustering cho nhiều markers
- Lazy load map component

### 3. Database Optimization
- Index trên latitude/longitude columns
- Consider PostGIS extension cho advanced geo queries

## 🔒 Security

### 1. API Key Protection
- Restrict API key theo domain
- Set up API quota limits
- Monitor usage trong Google Cloud Console

### 2. Input Validation
- Validate địa chỉ input
- Sanitize coordinates
- Handle API errors gracefully

## 📈 Future Enhancements

### Phase 2 Features
1. **Distance Calculation**: Tính khoảng cách giữa pickup và drop-off locations
2. **Route Optimization**: Hiển thị route tối ưu trên bản đồ
3. **Real-time Updates**: Cập nhật markers real-time khi có container mới
4. **Advanced Filtering**: Filter theo khoảng cách, vùng địa lý

### Performance Improvements
1. **Geocoding Cache**: Cache kết quả geocoding trong database
2. **Map Clustering**: Group nearby markers
3. **Lazy Loading**: Load map data theo demand

## 📞 Support

Nếu gặp vấn đề trong quá trình implementation:
1. Kiểm tra logs trong browser console
2. Verify API key và permissions
3. Test geocoding function riêng biệt
4. Check database migration status

---

**Last Updated**: June 2025
**Version**: 1.0.0 