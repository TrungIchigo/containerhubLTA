# Cargo Classification System Migration

## Mô tả
Triển khai hệ thống phân loại hàng hóa (Cargo Classification) để cải thiện khả năng ghép lệnh container và giải quyết tranh chấp.

## Database Migration

### 1. Chạy SQL Migration
Thực hiện file `cargo_types_migration.sql` trên Supabase Dashboard:

```sql
-- File: cargo_types_migration.sql
-- Bao gồm: Tạo bảng cargo_types, insert dữ liệu mẫu, cập nhật bảng hiện có
```

### 2. Xác minh Migration
Kiểm tra các thay đổi sau:

**Bảng mới:**
- ✅ `public.cargo_types` được tạo với 7 loại hàng hóa mẫu

**Cột mới được thêm:**
- ✅ `import_containers.cargo_type_id` - Foreign key đến cargo_types
- ✅ `export_bookings.cargo_type_id` - Foreign key đến cargo_types

**RLS Policies:**
- ✅ Authenticated users có thể đọc cargo_types
- ✅ Chỉ service_role có thể modify cargo_types (admin function)

## Code Changes Implemented

### 1. Database Types & Hooks
- ✅ `src/lib/types/cargo.ts` - CargoType và CargoClassificationOption interfaces
- ✅ `src/hooks/useCargoTypes.ts` - Custom hook để fetch cargo types

### 2. Form Components Updated
- ✅ `src/components/dispatcher/AddImportContainerForm.tsx` - Thêm cargo type selection
- ✅ `src/components/dispatcher/AddExportBookingForm.tsx` - Thêm cargo type selection
- ✅ `src/components/common/CargoTypeSelect.tsx` - Reusable component

### 3. Backend Actions Updated
- ✅ `src/lib/actions/dispatcher.ts` - addImportContainer & addExportBooking include cargo_type_id
- ✅ `src/lib/types.ts` - Updated form interfaces

## Cargo Types Hiện Có

| ID | Tên | Mô tả | Xử lý đặc biệt |
|----|-----|-------|----------------|
| 1 | Hàng Khô / Bách Hóa | Hàng hóa thông thường | Không |
| 2 | Hàng Lạnh / Đông Lạnh | Container lạnh, kiểm soát nhiệt độ | Có |
| 3 | Hàng Nguy Hiểm (DG) | Tuân thủ quy định IMDG | Có |
| 4 | Nông Sản | Gạo, cà phê, hạt điều... | Không |
| 5 | Hàng Quá Khổ / Quá Tải (OOG) | Vượt tiêu chuẩn container thường | Có |
| 6 | Hàng May Mặc | Quần áo, vải vóc | Không |
| 7 | Hàng Điện Tử | Thiết bị, linh kiện điện tử | Không |

## Business Rules

### Container Matching Logic
- Container từ `import_containers` chỉ có thể ghép với booking từ `export_bookings` nếu:
  - ✅ `container_type` khớp với `required_container_type`
  - ✅ `cargo_type_id` giống nhau
  - ✅ Cả hai đều có status `AVAILABLE`

### Admin Management
- Chỉ Platform Admin (service_role) mới có thể:
  - Thêm loại hàng hóa mới
  - Chỉnh sửa thông tin loại hàng hiện có
  - Vô hiệu hóa loại hàng

### User Experience
- Form validation: Loại hàng hóa là trường bắt buộc
- UI feedback: Loading states và error handling
- Tooltip: Hiển thị mô tả chi tiết khi hover
- Special handling indicator: Đánh dấu hàng cần xử lý đặc biệt

## Testing Checklist

### Form Validation
- [ ] Không thể submit form mà không chọn cargo type
- [ ] Hiển thị lỗi validation phù hợp
- [ ] Loading state khi fetch cargo types

### Database Operations
- [ ] Insert import container với cargo_type_id
- [ ] Insert export booking với cargo_type_id
- [ ] Foreign key constraints hoạt động

### Marketplace Matching
- [ ] Chỉ hiển thị compatible containers (same cargo type)
- [ ] Street turn request validation includes cargo type

## Future Enhancements

### Phase 2: Advanced Cargo Rules
- Container contamination tracking
- Cleaning requirements matrix
- Special handling procedures
- Cost impact calculation

### Phase 3: Analytics
- Cargo type performance metrics
- Container utilization by cargo type
- Special handling cost analysis

---

**Tác giả:** AI Implementation Team  
**Ngày:** 2024  
**Version:** 1.0 