# COD Fee Matrix Implementation

## 📋 Tổng quan

Hệ thống tính phí COD (Change of Destination) tự động dựa trên ma trận phí được định nghĩa trước giữa các depot.

## 🏗️ Cấu trúc

### 1. Database Schema
- **Bảng**: `cod_fee_matrix`
- **Cột chính**:
  - `origin_depot_id`: Depot gốc (UUID)
  - `destination_depot_id`: Depot đích (UUID)
  - `fee`: Phí COD (NUMERIC)
  - `distance_km`: Khoảng cách (NUMERIC, optional)

### 2. Logic tính phí
- **Cùng depot**: Phí = 0 VNĐ
- **Khoảng cách ≤ 10km**: Phí cố định 150,000 VNĐ
- **Khoảng cách 10-30km**: Phí cố định 350,000 VNĐ
- **Khoảng cách > 30km**: 200,000 + (km × 5,000) VNĐ

## 🚀 Cài đặt

### Bước 1: Tạo bảng database
```bash
# Chạy SQL script
psql -f 01_create_cod_fee_matrix_table.sql

# Hoặc copy-paste nội dung file vào database console
```

### Bước 2: Import dữ liệu
```bash
# Cài đặt dependencies
npm install @supabase/supabase-js

# Chạy import script
node 02_import_cod_fee_matrix_data.js
```

### Bước 3: Chạy tự động
#### Linux/Mac:
```bash
chmod +x 03_run_import.sh
./03_run_import.sh
```

#### Windows PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\03_run_import.ps1
```

## 🔧 API Usage

### Lấy phí COD giữa 2 depot
```typescript
import { getCodFee, formatCodFee } from '@/lib/actions/cod-fee'

const result = await getCodFee(originDepotId, destinationDepotId)
if (result.success) {
  console.log('Phí COD:', formatCodFee(result.fee))
}
```

### Lấy tất cả phí từ 1 depot
```typescript
import { getCodFeesForOrigin } from '@/lib/actions/cod-fee'

const result = await getCodFeesForOrigin(originDepotId)
if (result.success) {
  result.data.forEach(item => {
    console.log(`${item.destination_depot.name}: ${formatCodFee(item.fee)}`)
  })
}
```

## 🎯 Tích hợp UI

Hệ thống đã được tích hợp vào `CodRequestDialog`:
- Tự động tính phí khi chọn depot đích
- Hiển thị phí realtime
- Format tiền tệ VNĐ
- Xử lý lỗi gracefully

## 📊 Dữ liệu đầy đủ

Ma trận phí COD cho tất cả 28 depot:
- **File**: `cod_fee_matrix_full.csv` (28x28 = 784 entries)
- **Phí thấp nhất**: 150,000 VNĐ (≤10km)
- **Phí cao nhất**: 6,720,000 VNĐ (>1,300km)
- **Phí trung bình**: ~3,288,000 VNĐ

### Tạo ma trận phí đầy đủ:
```bash
# Tạo file CSV đầy đủ từ tọa độ depot
node 04_generate_full_cod_fee_matrix.js
```

### Danh sách depot đầy đủ:
- ICD Hải Linh - ICD Hoàng Thành - Cảng Lee & Man
- Bình Dương Port - ICD Tân Cảng Sóng Thần - Gemadept Đà Nẵng
- VIP Green Port - Cảng Cái Cui Cần Thơ - Solog Depot
- ICD Thanh Phước - ICD Tân Cảng Hà Nam - Viconship Đà Nẵng
- ICD Long Biên - ICD Tanamexco - ICD Phú Mỹ 1
- ICD Tân Cảng Hải Phòng - ICD Phước Long 3 - ICD Tân Cảng Nhơn Trạch
- ICD Tân Cảng Long Bình - ICD Gia Lâm - ICD Transimex
- ICD Km3+4 Móng Cái - ICD Phúc Lộc – Ninh Bình - ICD Tân Cảng Quế Võ
- Cảng Cát Lái - ICD Nam Đình Vũ - ECS Depot Biên Hòa
- ICD Đình Vũ – Quảng Bình

## ✅ Kiểm tra

### Verify database
```sql
-- Kiểm tra số lượng records
SELECT COUNT(*) FROM cod_fee_matrix;

-- Kiểm tra phí từ depot cụ thể
SELECT 
  od.name as origin_depot,
  dd.name as destination_depot,
  cfm.fee,
  cfm.distance_km
FROM cod_fee_matrix cfm
JOIN depots od ON cfm.origin_depot_id = od.id
JOIN depots dd ON cfm.destination_depot_id = dd.id
WHERE od.name ILIKE '%Bình Dương%'
ORDER BY cfm.fee;
```

### Test API
```typescript
// Test trong browser console hoặc component
const testFee = await getCodFee('depot-id-1', 'depot-id-2')
console.log(testFee)
```

## 🔄 Cập nhật phí

Để cập nhật ma trận phí:
1. Chỉnh sửa dữ liệu trong `02_import_cod_fee_matrix_data.js`
2. Chạy lại import script
3. Script sẽ tự động xóa dữ liệu cũ và import dữ liệu mới

## 🐛 Troubleshooting

### Lỗi "depot not found"
- Kiểm tra tên depot trong CSV có khớp với database không
- Sử dụng fuzzy matching trong `getDepotIdByName()`

### Lỗi "permission denied"
- Kiểm tra RLS policies trong Supabase
- Đảm bảo user có quyền đọc bảng `cod_fee_matrix`

### Phí không hiển thị
- Kiểm tra `container.depot_id` có tồn tại không
- Verify foreign key constraints
- Check browser console cho errors 