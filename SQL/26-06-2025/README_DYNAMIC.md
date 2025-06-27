# Test Dataset Creation - Dynamic UUID Version

## Tổng Quan
Thư mục này chứa các script SQL để tạo dữ liệu test comprehensive cho i-ContainerHub@LTA với **Auto-Generated UUID**. Phiên bản này sửa lỗi UUID cứng và phù hợp với cấu hình Supabase auto-generate.

## ⚠️ Quan Trọng - Sự Khác Biệt Với Version Cũ
- **Version cũ**: Sử dụng UUID cứng → Gây lỗi khi insert
- **Version mới**: UUID được auto-generate bởi Supabase → Tương thích hoàn toàn
- **LTA Admin**: Được tạo là TRUCKING_COMPANY với role CARRIER_ADMIN (không phải PLATFORM_ADMIN vì enum không hỗ trợ)

## Cấu Trúc Files

### Scripts Chính (Dynamic UUID)
```
01_organizations_profiles.sql      - Tạo 6 organizations + 3 user profiles
02_import_containers_dynamic.sql   - Tạo 40 import containers 
03_export_bookings_dynamic.sql     - Tạo 40 export bookings
04_street_turn_requests_dynamic.sql - Tạo 10 street turn requests
05_run_all_inserts_dynamic.sql     - Master script chạy tất cả
```

### Files Cũ (UUID Cứng - Deprecated)
```
02_import_containers.sql           - Deprecated - Có UUID cứng
03_export_bookings.sql             - Deprecated - Có UUID cứng
04_street_turn_requests.sql        - Deprecated - Có UUID cứng
05_run_all_inserts.sql             - Deprecated - Có UUID cứng
```

## Cách Sử Dụng

### Option 1: Chạy Từng File (Recommended)
```sql
-- Bước 1: Tạo organizations và profiles
\i 01_organizations_profiles.sql

-- Bước 2: Tạo import containers  
\i 02_import_containers_dynamic.sql

-- Bước 3: Tạo export bookings
\i 03_export_bookings_dynamic.sql

-- Bước 4: Tạo street turn requests
\i 04_street_turn_requests_dynamic.sql
```

### Option 2: Chạy Master Script
```sql
-- Chạy tất cả cùng lúc
\i 05_run_all_inserts_dynamic.sql
```

### Option 3: Copy-Paste từng Script
1. Mở file SQL trong editor
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor của Supabase
4. Chạy lần lượt

## Organizations Được Tạo

| Tên | Loại | Role | Suffix |
|-----|------|------|--------|
| LTA - Logistics Technology Authority 26062025 | TRUCKING_COMPANY | CARRIER_ADMIN | 26062025 |
| Công ty Vận tải ABC 26062025 | TRUCKING_COMPANY | DISPATCHER | 26062025 |
| Vận tải Test 01 26062025 | TRUCKING_COMPANY | DISPATCHER | 26062025 |
| Hãng tàu XYZ 26062025 | SHIPPING_LINE | - | 26062025 |
| Maersk Line 26062025 | SHIPPING_LINE | - | 26062025 |
| Ocean Network Express 26062025 | SHIPPING_LINE | - | 26062025 |

## Dataset Characteristics

### Import Containers (40)
- **Container Numbers**: XYZU + 7 digits (e.g., XYZU1234567)
- **Geographic Distribution**: 
  - TP.HCM Area: 22 containers
  - Northern Vietnam: 12 containers  
  - Central & South: 6 containers
- **Test Cases Covered**:
  - Case 1.1A: Internal Street-turn "Trên Đường" (5)
  - Case 1.1B: Internal Street-turn "Tại Depot" (2)  
  - Case 1.2: Same Company, Different Shipping Line (3)
  - Case 1.3: Marketplace Transactions (5)
  - Case 3.1 & 3.2: COD + Street-turn (4)
  - Case 4: Delayed Street-turn with Staging (4)
  - Quality Issues: VAS Required (3)
  - General Testing: 14 containers

### Export Bookings (40)
- **Booking Numbers**: LLRV + date format (e.g., LLRV240627001)
- **Strategic Matching**: Designed to create perfect matches for test scenarios
- **Distribution**: Split between 2 trucking companies for variety

### Street Turn Requests (10)
- **Pre-existing Requests**: Mix of APPROVED and PENDING statuses
- **Match Types**: INTERNAL, MARKETPLACE, COD_INTERNAL, COD_MARKETPLACE, VAS_REQUIRED
- **All approving_org_id**: Points to LTA Admin

## Test Scenarios Coverage

### Algorithm V2.0 Expected Results
- **Level 1 (>85 points)**: Internal depot matches
- **Level 2 (70-85 points)**: Short distance, same-day operations  
- **Level 3 (50-70 points)**: Cross-company marketplace
- **Level 4 (30-50 points)**: COD required scenarios
- **Level 5 (<30 points)**: Complex multi-challenge scenarios

### Geographic Test Cases
- **Same City Matches**: TP.HCM internal operations
- **Regional Matches**: North-South logistics
- **COD Testing**: Remote locations requiring COD
- **Cross-Region**: Complex routing scenarios

## Verification Queries

### Check Data Creation Success
```sql
-- Count organizations
SELECT 'Organizations created' as item, count(*) as count 
FROM organizations WHERE name LIKE '%26062025';

-- Count containers 
SELECT 'Import containers' as item, count(*) as count
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id 
WHERE o.name LIKE '%26062025';

-- Count bookings
SELECT 'Export bookings' as item, count(*) as count
FROM export_bookings eb  
JOIN organizations o ON eb.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025';
```

### Test Case Validation
```sql
-- Marketplace containers
SELECT count(*) as marketplace_containers
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025' 
AND ic.is_listed_on_marketplace = true;

-- Quality issues containers
SELECT count(*) as quality_issue_containers  
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025'
AND ic.condition_images IS NOT NULL;
```

## Cleanup (Nếu Cần)

```sql
-- Xóa tất cả dữ liệu test (CẨNTẸT)
DELETE FROM street_turn_requests str 
USING organizations o 
WHERE str.requesting_org_id = o.id 
AND o.name LIKE '%26062025';

DELETE FROM export_bookings eb
USING organizations o  
WHERE eb.trucking_company_org_id = o.id
AND o.name LIKE '%26062025';

DELETE FROM import_containers ic
USING organizations o
WHERE ic.trucking_company_org_id = o.id  
AND o.name LIKE '%26062025';

DELETE FROM profiles p
USING organizations o
WHERE p.organization_id = o.id
AND o.name LIKE '%26062025';

DELETE FROM organizations 
WHERE name LIKE '%26062025';
```

## Notes

- **Suffix "26062025"**: Ngăn conflict với dữ liệu production
- **Real Depot IDs**: Sử dụng depot IDs thật từ CSV files
- **Real Coordinates**: Latitude/longitude thật từ Google Maps
- **COD Flow Compliance**: Tuân thủ 6-stage COD workflow đã define
- **Algorithm Ready**: Sẵn sàng cho Algorithm V2.0 testing

## Support

Nếu gặp lỗi:
1. Kiểm tra organizations enum có đúng `TRUCKING_COMPANY` và `SHIPPING_LINE`
2. Kiểm tra user_role enum có đúng `DISPATCHER` và `CARRIER_ADMIN`  
3. Đảm bảo các UUID generation functions hoạt động trong Supabase
4. Kiểm tra foreign key constraints

---
**Created**: 26-06-2025  
**Version**: Dynamic UUID 1.0  
**Compatible**: Supabase PostgreSQL với auto-generated UUID 