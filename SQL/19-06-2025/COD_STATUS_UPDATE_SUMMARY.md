# COD Status Update Summary

## Mục đích
Cập nhật enum `cod_request_status` và các thành phần liên quan để hỗ trợ **luồng nghiệp vụ COD đầy đủ** theo mô tả trong file `3. COD Flow.md`.

## Các Trạng Thái Mới Được Thêm

### 1. Database Enum Updates
```sql
-- Thêm vào cod_request_status enum:
'PENDING_PAYMENT'       -- Chờ thanh toán (sau khi xác nhận đã giao trả)
'PAID'                  -- Đã thanh toán  
'PROCESSING_AT_DEPOT'   -- Đang xử lý tại Depot
'COMPLETED'             -- Hoàn tất

-- Thêm vào audit_log_action enum:
'DELIVERY_CONFIRMED'    -- Xác nhận đã giao trả
'PAYMENT_CONFIRMED'     -- Xác nhận đã thanh toán
'DEPOT_PROCESSING_STARTED' -- Bắt đầu xử lý tại depot
'COMPLETED'             -- Hoàn tất
```

### 2. New Database Columns
```sql
-- Thêm vào bảng cod_requests:
delivery_confirmed_at       TIMESTAMPTZ  -- Thời điểm xác nhận giao trả
payment_confirmed_at        TIMESTAMPTZ  -- Thời điểm xác nhận thanh toán  
depot_processing_started_at TIMESTAMPTZ  -- Thời điểm bắt đầu xử lý tại depot
completed_at                TIMESTAMPTZ  -- Thời điểm hoàn tất
```

### 3. TypeScript Type Updates
```typescript
// Cập nhật src/lib/types.ts
export type CodRequestStatus = 
  'PENDING' | 'APPROVED' | 'DECLINED' | 'AWAITING_INFO' | 'EXPIRED' | 'REVERSED' |
  'PENDING_PAYMENT' | 'PAID' | 'PROCESSING_AT_DEPOT' | 'COMPLETED'

export type AuditLogAction = 
  'CREATED' | 'APPROVED' | 'DECLINED' | 'INFO_REQUESTED' | 'INFO_SUBMITTED' | 
  'EXPIRED' | 'REVERSED' | 'CANCELLED' |
  'DELIVERY_CONFIRMED' | 'PAYMENT_CONFIRMED' | 'DEPOT_PROCESSING_STARTED' | 'COMPLETED'
```

## Luồng Nghiệp Vụ Hoàn Chỉnh

```
1. PENDING           →  Dispatcher tạo yêu cầu
2. APPROVED          →  LTA Admin phê duyệt  
3. PENDING_PAYMENT   →  Dispatcher xác nhận đã giao trả
4. PAID              →  LTA Admin xác nhận đã thanh toán
5. PROCESSING_AT_DEPOT → Hệ thống cập nhật khi depot bắt đầu xử lý
6. COMPLETED         →  e-Depot báo hiệu xử lý xong
```

## Các Thành Phần Được Tạo Mới

### 1. Helper Function
- `update_cod_request_status()` - Cập nhật trạng thái với timestamp tự động và audit log

### 2. Monitoring View  
- `cod_request_flow_view` - View để theo dõi luồng nghiệp vụ và thời gian xử lý

### 3. Enhanced Constraints
- Cập nhật constraint `valid_status_transitions` để bao gồm các trạng thái mới
- Đảm bảo timestamp được set khi chuyển sang trạng thái tương ứng

## Cách Sử dụng

### 1. Chạy Update Database
```powershell
cd SQL/19-06-2025
./04_run_cod_status_update.ps1
```

### 2. Sử dụng Helper Function
```sql
-- Cập nhật trạng thái với helper function
SELECT update_cod_request_status(
    'request-id-here',
    'PENDING_PAYMENT',
    'user-id-here', 
    'Organization Name',
    '{"note": "Container delivered successfully"}'::jsonb
);
```

### 3. Monitor COD Flow
```sql
-- Xem trạng thái và thời gian xử lý
SELECT * FROM cod_request_flow_view 
WHERE status IN ('PENDING_PAYMENT', 'PAID', 'PROCESSING_AT_DEPOT')
ORDER BY created_at DESC;
```

## Tác Động Frontend

### Components Cần Cập Nhật
1. **COD Request Status Badge** - Thêm UI cho 4 trạng thái mới
2. **Dispatcher Dashboard** - Thêm nút "Xác nhận đã giao trả"
3. **Admin Dashboard** - Thêm nút "Xác nhận thanh toán"
4. **Timeline Component** - Hiển thị các bước mới trong timeline

### API Actions Cần Tạo
1. `confirmCodDelivery()` - Dispatcher xác nhận đã giao trả
2. `confirmCodPayment()` - Admin xác nhận thanh toán  
3. `updateDepotProcessing()` - Cập nhật trạng thái xử lý depot
4. `completeCodRequest()` - Hoàn tất yêu cầu COD

## Tích Hợp e-Depot

Các trạng thái `PROCESSING_AT_DEPOT` và `COMPLETED` sẽ được cập nhật thông qua:
- **Webhook từ e-Depot system** 
- **Scheduled job** kiểm tra trạng thái định kỳ
- **Manual update** bởi admin khi cần thiết

## Testing Checklist

- [ ] Enum values được thêm thành công
- [ ] Timestamp columns hoạt động đúng
- [ ] Helper function cập nhật trạng thái chính xác
- [ ] Audit logs được ghi đầy đủ
- [ ] View hiển thị thông tin đúng
- [ ] TypeScript types compile không lỗi
- [ ] Frontend components render các trạng thái mới
- [ ] Complete flow test từ PENDING → COMPLETED

## Files Được Tạo/Cập Nhật

### Database
- `SQL/19-06-2025/04_update_cod_status_enum.sql` - Script SQL chính
- `SQL/19-06-2025/04_run_cod_status_update.ps1` - PowerShell runner

### Frontend  
- `src/lib/types.ts` - Cập nhật TypeScript types
- `src/lib/actions/cod.ts` - Sẽ cần thêm actions mới (future)

### Documentation
- `SQL/19-06-2025/COD_STATUS_UPDATE_SUMMARY.md` - Tài liệu này 