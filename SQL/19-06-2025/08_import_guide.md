# 📋 Hướng Dẫn Import COD Fee Matrix vào Table Đã Tồn Tại

## 🎯 Mục đích
Hướng dẫn này giúp bạn import dữ liệu từ file `cod_fee_matrix_full.csv` vào table `cod_fee_matrix` đã được tạo sẵn trong database.

## 📋 Yêu cầu hệ thống

### 1. Database Schema
Table `cod_fee_matrix` phải có cấu trúc:
```sql
create table public.cod_fee_matrix (
  id uuid not null default gen_random_uuid (),
  origin_depot_id uuid not null,
  destination_depot_id uuid not null,
  fee numeric(12, 2) not null default 0,
  distance_km numeric(8, 2) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cod_fee_matrix_pkey primary key (id),
  constraint uk_depot_pair unique (origin_depot_id, destination_depot_id),
  constraint fk_destination_depot foreign KEY (destination_depot_id) references depots (id) on delete CASCADE,
  constraint fk_origin_depot foreign KEY (origin_depot_id) references depots (id) on delete CASCADE
)
```

### 2. Phần mềm cần thiết
- **Node.js** (v16 trở lên)
- **PowerShell** (Windows) hoặc **Bash** (Linux/Mac)
- **Supabase** credentials

### 3. Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 📁 Files cần thiết
1. `cod_fee_matrix_full.csv` - Dữ liệu COD fee matrix (28x28 depots)
2. `06_import_cod_fee_to_existing_table.js` - Script import chính
3. `07_run_import_existing_table.ps1` - PowerShell launcher script

## 🚀 Hướng dẫn từng bước

### Bước 1: Chuẩn bị môi trường
```powershell
# Di chuyển đến thư mục chứa các file import
cd "SQL/19-06-2025"

# Kiểm tra các file cần thiết
ls cod_fee_matrix_full.csv
ls 06_import_cod_fee_to_existing_table.js
ls 07_run_import_existing_table.ps1
```

### Bước 2: Thiết lập biến môi trường
```powershell
# Thiết lập environment variables
$env:NEXT_PUBLIC_SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"

# Hoặc thêm vào .env file trong project root
```

### Bước 3: Chạy import script
```powershell
# Chạy PowerShell script (Khuyến khích)
./07_run_import_existing_table.ps1

# Hoặc chạy trực tiếp với Node.js
node 06_import_cod_fee_to_existing_table.js
```

### Bước 4: Xác nhận import thành công
```sql
-- Kiểm tra số lượng records
SELECT COUNT(*) FROM cod_fee_matrix;
-- Kết quả mong đợi: 784 records (28x28)

-- Kiểm tra dữ liệu mẫu
SELECT 
  o.name as origin_depot,
  d.name as destination_depot,
  cfm.fee,
  cfm.distance_km
FROM cod_fee_matrix cfm
JOIN depots o ON cfm.origin_depot_id = o.id
JOIN depots d ON cfm.destination_depot_id = d.id
LIMIT 5;
```

## 📊 Dữ liệu import

### Thông tin CSV
- **Số lượng depot**: 28 depot
- **Tổng số records**: 784 (28 × 28)
- **Phí tối thiểu**: 150,000 VNĐ
- **Phí tối đa**: 6,720,000 VNĐ
- **Phí trung bình**: ~3,288,286 VNĐ

### Cách tính phí COD
1. **≤ 10km**: 150,000 VNĐ (cố định)
2. **10-30km**: 350,000 VNĐ (cố định)
3. **> 30km**: 200,000 VNĐ + (khoảng cách × 5,000 VNĐ/km)

## ⚠️ Lưu ý quan trọng

### 1. Backup dữ liệu
```sql
-- Backup table trước khi import (nếu có dữ liệu quan trọng)
CREATE TABLE cod_fee_matrix_backup AS 
SELECT * FROM cod_fee_matrix;
```

### 2. Xử lý lỗi thường gặp

#### Lỗi: Depot không tìm thấy
```
⚠️ Could not find depot: "Depot Name"
```
**Giải pháp**: Kiểm tra table `depots` có đầy đủ 28 depot không

#### Lỗi: Foreign key constraint
```
❌ Error: Foreign key constraint violation
```
**Giải pháp**: Đảm bảo tất cả depot IDs trong CSV đều tồn tại trong table `depots`

#### Lỗi: Unique constraint
```
❌ Error: Duplicate key value violates unique constraint
```
**Giải pháp**: Script sẽ tự động xóa dữ liệu cũ trước khi import

### 3. Performance
- Import thực hiện theo batch (100 records/batch)
- Thời gian dự kiến: 1-3 phút
- Script tự động tính toán `distance_km` dựa trên GPS coordinates

## 🔧 Troubleshooting

### Script không chạy được
```powershell
# Kiểm tra Node.js
node --version

# Cài đặt dependencies
npm install @supabase/supabase-js

# Kiểm tra permissions
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Kết nối Supabase thất bại
```javascript
// Kiểm tra credentials trong 06_import_cod_fee_to_existing_table.js
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Service Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length)
```

## 🎉 Hoàn thành

Sau khi import thành công:

1. ✅ Table `cod_fee_matrix` có 784 records
2. ✅ COD Request Dialog hiển thị phí thực tế
3. ✅ API `getCodFee()` hoạt động chính xác
4. ✅ Hệ thống COD đã sẵn sàng sử dụng

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong console
2. Xem file error context nếu có
3. Kiểm tra Supabase dashboard
4. Đảm bảo table `depots` có đủ 28 depot với GPS coordinates 