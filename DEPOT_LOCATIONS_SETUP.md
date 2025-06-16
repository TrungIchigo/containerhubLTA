# Depot Locations Setup - Hướng Dẫn Chi Tiết

## 🎯 Mục tiêu
Thay thế input text địa điểm bằng hệ thống dropdown phụ thuộc:
- **Dropdown 1**: Chọn Thành phố/Tỉnh (34 đơn vị hành chính)
- **Dropdown 2**: Chọn Depot/ICD cụ thể trong thành phố đã chọn

## 📋 Bước 1: Chạy Migration Tạo Bảng Cities & Depots

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor** > **"+ New query"**
4. Copy và paste nội dung file `SQL/depot_locations_migration.sql`
5. Click **"RUN"** để thực thi

**Kết quả mong đợi:**
- ✅ Tạo bảng `cities` với 34 tỉnh/thành phố
- ✅ Tạo bảng `depots` với 28 depot/ICD thực tế
- ✅ Thiết lập RLS policies
- ✅ Tạo indexes tối ưu

## 📋 Bước 2: Cập Nhật Schema Containers

1. Trong **SQL Editor**, tạo query mới
2. Copy và paste nội dung file `SQL/update_containers_schema.sql`
3. Click **"RUN"** để thực thi

**Kết quả mong đợi:**
- ✅ Thêm cột `city_id` và `depot_id` vào `import_containers`
- ✅ Thêm cột `city_id` và `depot_id` vào `export_bookings`
- ✅ Tạo foreign key constraints
- ✅ Tạo indexes cho performance

## 📋 Bước 3: Kiểm Tra Dữ Liệu

Chạy các query sau để verify:

```sql
-- Kiểm tra số lượng cities (phải có 34)
SELECT COUNT(*) as total_cities, 
       COUNT(CASE WHEN is_major_city THEN 1 END) as major_cities
FROM cities;

-- Kiểm tra số lượng depots (phải có 28)
SELECT COUNT(*) as total_depots FROM depots;

-- Kiểm tra depots theo thành phố
SELECT c.name as city_name, COUNT(d.id) as depot_count
FROM cities c
LEFT JOIN depots d ON c.id = d.city_id
GROUP BY c.id, c.name
ORDER BY c.is_major_city DESC, c.name;
```

## 📋 Bước 4: Test Frontend Integration

### 4.1 Test LocationSelector Component

1. Vào trang **Dispatcher** > **Thêm Lệnh Giao Trả**
2. Kiểm tra dropdown "Thành phố/Tỉnh":
   - ✅ Hiển thị 34 tỉnh/thành phố
   - ✅ Thành phố lớn có icon 🏙️, tỉnh có icon 🏘️
   - ✅ Sắp xếp: thành phố lớn trước, sau đó theo alphabet

3. Chọn "Thành phố Hồ Chí Minh":
   - ✅ Dropdown "Depot" được kích hoạt
   - ✅ Hiển thị 8 depot trong khu vực
   - ✅ Tooltip hiển thị địa chỉ đầy đủ

### 4.2 Test Form Validation

1. Thử submit form không chọn thành phố:
   - ✅ Hiển thị lỗi "Thành phố là bắt buộc"

2. Chọn thành phố nhưng không chọn depot:
   - ✅ Hiển thị lỗi "Depot/Địa điểm là bắt buộc"

3. Thay đổi thành phố khi đã chọn depot:
   - ✅ Depot được reset về trống
   - ✅ Dropdown depot load danh sách mới

## 📋 Bước 5: Verify Database Integration

### 5.1 Test Import Container Creation

1. Tạo một lệnh giao trả mới với:
   - Thành phố: "Thành phố Hồ Chí Minh"
   - Depot: "Cảng Cát Lái"

2. Kiểm tra trong database:
```sql
SELECT 
  ic.container_number,
  c.name as city_name,
  d.name as depot_name,
  d.address,
  ic.latitude,
  ic.longitude
FROM import_containers ic
JOIN cities c ON ic.city_id = c.id
JOIN depots d ON ic.depot_id = d.id
ORDER BY ic.created_at DESC
LIMIT 1;
```

### 5.2 Test Export Booking Creation

1. Tạo một booking xuất mới
2. Verify tương tự với query:
```sql
SELECT 
  eb.booking_number,
  c.name as city_name,
  d.name as depot_name
FROM export_bookings eb
JOIN cities c ON eb.city_id = c.id
JOIN depots d ON eb.depot_id = d.id
ORDER BY eb.created_at DESC
LIMIT 1;
```

## 🎨 Features Đã Implement

### ✅ LocationSelector Component
- Dropdown phụ thuộc (city → depot)
- Loading states với spinner
- Error handling và validation
- Icons phân biệt thành phố lớn/tỉnh
- Tooltip hiển thị địa chỉ depot
- Auto-reset depot khi đổi city

### ✅ Data Management
- 34 tỉnh/thành phố theo cấu trúc mới
- 28 depot/ICD thực tế với tọa độ GPS
- Mapping logic theo khu vực địa lý
- RLS policies bảo mật

### ✅ Form Integration
- Thay thế input text bằng dropdown
- Validation bắt buộc cho cả city và depot
- Form reset handling
- Error display

## 🚀 Benefits

1. **Chuẩn hóa dữ liệu**: Không còn nhập tự do, tránh lỗi chính tả
2. **Tích hợp bản đồ**: Có tọa độ GPS chính xác cho mỗi depot
3. **Tìm kiếm tối ưu**: Filter theo khu vực địa lý
4. **UX tốt hơn**: Dropdown phụ thuộc, loading states
5. **Scalable**: Dễ thêm depot mới, cập nhật thông tin

## 🔧 Troubleshooting

### Lỗi "Cities not loading"
- Kiểm tra RLS policies đã enable chưa
- Verify bảng `cities` có dữ liệu

### Lỗi "Depots not loading"
- Kiểm tra foreign key constraints
- Verify city_id được truyền đúng

### Form validation errors
- Kiểm tra schema validation trong form
- Verify field names match database columns

---

**✅ Hoàn thành setup khi:**
- [ ] 34 cities được tạo thành công
- [ ] 28 depots được tạo với tọa độ
- [ ] Schema containers được cập nhật
- [ ] LocationSelector hoạt động đúng
- [ ] Form validation working
- [ ] Database integration verified