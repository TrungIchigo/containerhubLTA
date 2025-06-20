# Marketplace Sample Data Guide

## Mô tả
File này hướng dẫn cách tạo và sử dụng dữ liệu mẫu cho tính năng marketplace trong i-ContainerHub@LTA.

## Cách chạy script tạo dữ liệu mẫu

### 1. Chạy script SQL
```bash
# Kết nối đến Supabase database và chạy script
psql -h <your_supabase_host> -p <port> -U <username> -d <database_name> -f marketplace_sample_data.sql
```

Hoặc copy nội dung file `marketplace_sample_data.sql` và paste vào Supabase SQL Editor.

### 2. Xác minh dữ liệu đã được tạo
Script sẽ tự động chạy query xác minh ở cuối:
```sql
SELECT 
    ic.container_number,
    ic.container_type,
    ic.drop_off_location,
    ic.available_from_datetime,
    tc.name as trucking_company,
    sl.name as shipping_line,
    ic.is_listed_on_marketplace
FROM import_containers ic
JOIN organizations tc ON ic.trucking_company_org_id = tc.id
JOIN organizations sl ON ic.shipping_line_org_id = sl.id
WHERE ic.is_listed_on_marketplace = true
ORDER BY ic.created_at DESC;
```

## Dữ liệu được tạo

### Công ty vận tải (5 công ty)
1. **Công ty Vận Tải ABC** - TP.HCM
2. **Dịch Vụ Logistics XYZ** - TP.HCM  
3. **Vận Tải Container DEF** - TP.HCM
4. **Logistics Express GHI** - TP.HCM
5. **Vận Chuyển Hàng Hóa JKL** - TP.HCM

### Hãng tàu (5 hãng tàu)
1. **Maersk Line Vietnam**
2. **COSCO Shipping Lines**
3. **Evergreen Marine**
4. **MSC Mediterranean**
5. **OOCL Orient Overseas**

### Container import (18 containers)
- **6 containers 20GP** (20-foot General Purpose)
- **6 containers 40GP** (40-foot General Purpose) 
- **3 containers 40HC** (40-foot High Cube)
- **3 containers 45HC** (45-foot High Cube)

### Phân bố địa lý
- **TP.HCM**: 9 containers (Cảng Cát Lái, Tân Cảng, Hiệp Phước, ICD Phước Long, ICD Tân Thuận, Depot Phú Mỹ Hưng)
- **Hà Nội**: 4 containers (Depot Văn Điển, Cảng Nội Bài, Depot Gia Lâm)
- **Hải Phòng**: 3 containers (Cảng Hải Phòng, Cảng Đình Vũ, Cảng Cửa Lò)
- **Đà Nẵng**: 3 containers (Cảng Đà Nẵng, Depot Liên Chiểu, Cảng Tiên Sa)

### Loại hàng hóa
- **General Cargo** (Hàng tổng hợp)
- **Electronics** (Điện tử)
- **Textiles** (Dệt may)
- **Machinery** (Máy móc)

## Tính năng marketplace sau khi có dữ liệu

### 1. Bộ lọc hoạt động
- **Loại container**: 20GP, 40GP, 40HC, 45HC
- **Hãng tàu**: Maersk, COSCO, Evergreen, MSC, OOCL
- **Địa điểm**: Tìm kiếm theo tên cảng/depot
- **Thời gian**: Lọc theo ngày có sẵn

### 2. Bản đồ hiển thị
- Các marker hiển thị vị trí container trên bản đồ Việt Nam
- Tập trung tại 4 thành phố lớn: TP.HCM, Hà Nội, Hải Phòng, Đà Nẵng

### 3. Bảng danh sách
- Hiển thị 18 containers từ 5 công ty khác nhau
- Thông tin đầy đủ: container number, loại, địa điểm, thời gian, công ty, hãng tàu
- Nút "Yêu Cầu Ghép Nối" cho mỗi container

### 4. Chức năng tạo yêu cầu marketplace
- User có thể tạo yêu cầu ghép nối với container từ công ty khác
- Hệ thống sẽ gửi thông báo đến công ty sở hữu container để phê duyệt

## Ghi chú kỹ thuật

### Z-index layering
```css
.filters-section { z-index: 30; }    /* Cao nhất - dropdown không bị che */
.results-section { z-index: 20; }    /* Trung bình */
.map-section { z-index: 10; }        /* Thấp nhất - không che dropdown */
```

### Thứ tự hiển thị mới
1. **Bộ Lọc Tìm Kiếm** (có z-index cao)
2. **Cơ Hội Tái Sử Dụng Container** (với icon Recycle màu xanh)
3. **Bản Đồ Địa Điểm** (ở cuối để tránh che dropdown)

### Icons được sử dụng
- **Filter**: Bộ lọc tìm kiếm  
- **Recycle**: Cơ hội tái sử dụng container (màu xanh #16a34a)
- **Map**: Bản đồ địa điểm

## Cách test

1. **Login** với tài khoản DISPATCHER
2. **Vào trang Marketplace** (/marketplace)
3. **Kiểm tra hiển thị**: Bộ lọc → Danh sách containers → Bản đồ
4. **Test dropdown**: Click vào dropdown "Chọn loại container" - không bị che bởi bản đồ
5. **Test bản đồ**: Các marker hiển thị đúng vị trí
6. **Test filter**: Lọc theo loại container, hãng tàu, địa điểm
7. **Test yêu cầu**: Click "Yêu Cầu Ghép Nối" để tạo marketplace request

## Troubleshooting

### Không hiển thị container nào
- Kiểm tra `is_listed_on_marketplace = true`
- Kiểm tra `status = 'AVAILABLE'`
- Kiểm tra user không xem container của chính công ty mình

### Dropdown bị che
- Kiểm tra z-index của `.card` elements
- Đảm bảo filters có z-index cao nhất (30)

### Bản đồ không hiển thị marker
- Kiểm tra latitude/longitude có hợp lệ
- Kiểm tra Google Maps API key
- Xem console log có error không

### Lỗi SQL "malformed array literal"
Nếu gặp lỗi `ERROR: 22P02: malformed array literal: "[]"`, đảm bảo sử dụng cú pháp đúng cho mảng trống:
```sql
-- SAI: '[]'
-- ĐÚNG: ARRAY[]::TEXT[]
condition_images, attached_documents
VALUES
(ARRAY[]::TEXT[], ARRAY[]::TEXT[])
```

### Lỗi "null value in column violates not-null constraint"
Nếu gặp lỗi `ERROR: 23502: null value in column "container_type_id"`, có nghĩa là:
- Database chưa có container types hoặc cargo types
- Script không tìm thấy cities hoặc depots

**Giải pháp:** Script đã được cập nhật để:
- Tự động tạo container types (20GP, 40GP, 40HC, 45HC) nếu chưa có
- Tự động tạo cargo types (General, Electronics, Textiles, Machinery) nếu chưa có  
- Tự động tạo cities (TP.HCM, Hà Nội, Hải Phòng, Đà Nẵng) nếu chưa có
- Tự động tạo depots tương ứng nếu chưa có

### Lỗi tìm kiếm dữ liệu không khớp
Script sử dụng `ILIKE` (case-insensitive) và nhiều pattern matching:
```sql
-- Ví dụ tìm TP.HCM
WHERE name ILIKE '%hồ chí minh%' OR name ILIKE '%tp.hcm%' OR name ILIKE '%saigon%'
``` 