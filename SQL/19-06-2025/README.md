# GPG COD Fee Matrix - Correct Business Logic Implementation

## 📋 Business Logic (Cập nhật mới)

### ✅ Logic Đúng:
1. **Container từ BẤT KỲ depot nào** đều có thể tạo COD request
2. **Điểm đến CHỈ được chọn từ depot GPG** (bảng `gpg_depots`)
3. **Phí COD được tính từ matrix `gpg_cod_fee_matrix`** với route: `ANY depot → GPG depot`

### ❌ Logic Cũ (đã sửa):
- ~~Chỉ container từ depot GPG mới có thể COD~~
- ~~Matrix chỉ có route giữa các depot GPG với nhau~~

## 🗂️ Cấu trúc Database

### Bảng `gpg_depots`
- Chứa **chỉ các depot thuộc GPG**
- Là nguồn dữ liệu cho dropdown "Depot đích" trong COD form
- Container có thể COD **ĐẾN** những depot này

### Bảng `gpg_cod_fee_matrix`  
- Origin: `public.depots` (TẤT CẢ depot)
- Destination: `public.gpg_depots` (CHỈ depot GPG)
- Matrix: `ALL depot → GPG depot`

## 📁 Files Cập Nhật

### 1. Import Data Mới
- `05_import_all_depot_to_gpg_cod_fee_matrix.sql` - **Script chính để import đúng logic**
- `06_run_all_depot_to_gpg_import.ps1` - PowerShell runner
- `07_check_current_data.sql` - Kiểm tra data hiện tại

### 2. Code Changes
- `src/lib/actions/cod-fee-client.ts` - Chỉ check destination depot là GPG
- `src/lib/actions/cod.ts` - Query `gpg_cod_fee_matrix` thay vì `cod_fee_matrix`
- `src/components/features/cod/CodRequestDialog.tsx` - Remove debug UI

## 🚀 Cách Chạy

### Option 1: PowerShell (Recommended)
```powershell
cd "SQL\19-06-2025"
powershell -ExecutionPolicy Bypass -File "06_run_all_depot_to_gpg_import.ps1"
```

### Option 2: Direct SQL
```bash
psql "your_database_url" -f "05_import_all_depot_to_gpg_cod_fee_matrix.sql"
```

### Option 3: Supabase Dashboard
Copy nội dung file `05_import_all_depot_to_gpg_cod_fee_matrix.sql` và chạy trong SQL Editor

## 📊 Expected Results

Sau khi chạy script thành công:

```sql
-- Kiểm tra số lượng routes
SELECT COUNT(*) as total_routes FROM gpg_cod_fee_matrix;
-- Expected: (tổng số depot) × (số depot GPG) - (số depot GPG)

-- Kiểm tra có route từ depot thường → depot GPG
SELECT * FROM gpg_cod_fee_matrix 
WHERE origin_depot_id NOT IN (SELECT id FROM gpg_depots)
LIMIT 5;
-- Should return data

-- Test container CSQU3054383
SELECT gm.fee, gm.distance_km 
FROM gpg_cod_fee_matrix gm
JOIN import_containers ic ON ic.depot_id = gm.origin_depot_id
WHERE ic.container_number = 'CSQU3054383'
  AND gm.destination_depot_id = 'any_gpg_depot_id';
-- Should return COD fee
```

## 🔧 Troubleshooting

### Vấn đề: "Container hiện tại không thuộc depot GPG"
- ✅ **Đã sửa**: Logic mới cho phép container từ depot thường COD đến depot GPG

### Vấn đề: "Không tìm thấy biểu phí cho tuyến này"
- Kiểm tra: `gpg_cod_fee_matrix` có route từ depot gốc → depot GPG không
- Chạy: `07_check_current_data.sql` để debug

### Vấn đề: Connection timeout
- Sử dụng Supabase Dashboard SQL Editor thay vì psql
- Copy/paste nội dung SQL file trực tiếp

## 📈 Performance

Script được tối ưu với:
- **Tiered pricing**: Phí theo khoảng cách (30km, 100km, 300km+)
- **Minimum fee**: 200,000 VNĐ
- **Indexes**: `(origin_depot_id, destination_depot_id)`
- **Batch insert**: Tất cả routes trong 1 transaction

## ✅ Verification

Test với container `CSQU3054383`:
1. Container từ depot non-GPG
2. Chọn depot GPG làm điểm đến  
3. COD fee sẽ được tính và hiển thị
4. Form submit thành công 