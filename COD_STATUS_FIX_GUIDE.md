# COD Status Fix Guide

## 🚀 Vấn đề đã được Fix

Vấn đề: **Các lệnh giao trả (import_containers) chưa được cập nhật status sau khi admin duyệt/từ chối COD requests.**

## ✅ Giải pháp đã triển khai

### 1. **Cập nhật Stored Functions**
- Đã fix `approve_cod_request()` function để cập nhật container status thành `AWAITING_COD_PAYMENT` (thay vì `AVAILABLE`)
- Tạo mới `reject_cod_request()` function để cập nhật container status thành `COD_REJECTED`
- Tạo trigger để log container status changes

### 2. **Cập nhật UI Components**
- **ImportContainersTable.tsx**: Đã implement đầy đủ action buttons cho từng giai đoạn COD
- **API Route mới**: `/api/cod/container-requests` để tìm COD request theo container ID
- **Loading states**: Disable buttons khi đang xử lý

### 3. **COD Status Flow đã được đồng bộ**
```
1. AVAILABLE → AWAITING_COD_APPROVAL (khi submit COD form)
2. AWAITING_COD_APPROVAL → COD_REJECTED (admin từ chối) 
                        → AWAITING_COD_PAYMENT (admin duyệt)
3. AWAITING_COD_PAYMENT → ON_GOING_COD (payment successful)
4. ON_GOING_COD → PROCESSING (user confirms completion)
5. PROCESSING → COMPLETED (depot processing done)
```

## 🧪 Cách Test COD Flow

### Bước 1: Chạy SQL Scripts
```bash
# 1. Fix enum error (chạy script này trước)
psql -d your_database -f fix_audit_enum_error.sql

# 2. Fix existing data và stored functions  
psql -d your_database -f fix_cod_container_status.sql

# 3. Test và verify
psql -d your_database -f test_cod_flow.sql
```

### Bước 2: Test trên UI

#### **2.1. Dispatcher Dashboard**
1. Vào `Dispatcher > Danh sách lệnh giao trả`
2. Tìm container có status `AVAILABLE`
3. Click "Yêu cầu Đổi Nơi Trả" → Container chuyển thành `AWAITING_COD_APPROVAL`

#### **2.2. Admin Dashboard**
1. Vào `Carrier Admin > COD Requests`
2. Duyệt/Từ chối COD request
3. **Kiểm tra**: Container status phải cập nhật tương ứng:
   - **Duyệt** → `AWAITING_COD_PAYMENT`
   - **Từ chối** → `COD_REJECTED`

#### **2.3. Payment Flow**
1. Container có status `AWAITING_COD_PAYMENT`
2. Click "Thanh toán phí COD" → Chuyển đến `/billing`
3. Sau khi admin confirm payment → Container thành `ON_GOING_COD`

#### **2.4. Completion Flow**
1. Container có status `ON_GOING_COD`
2. Click "Xác nhận hoàn tất COD" → Container thành `PROCESSING`
3. Admin confirm depot completion → Container thành `COMPLETED`

## 🔍 Debug và Kiểm tra

### Kiểm tra Container Status
```sql
SELECT 
    ic.container_number,
    ic.status as container_status,
    cr.status as cod_status,
    cr.created_at,
    cr.approved_at
FROM import_containers ic
LEFT JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
WHERE ic.status LIKE '%COD%' OR ic.status LIKE '%AWAITING%'
ORDER BY cr.created_at DESC;
```

### Xem Audit Log
```sql
SELECT 
    cal.action,
    cal.details,
    cal.created_at,
    cr.status
FROM cod_audit_logs cal
JOIN cod_requests cr ON cal.request_id = cr.id
ORDER BY cal.created_at DESC
LIMIT 10;
```

## 🎯 Action Buttons Available

| Container Status | Available Actions | Location |
|------------------|-------------------|----------|
| `AVAILABLE` | Yêu cầu Đổi Nơi Trả | Dispatcher Dashboard |
| `AWAITING_COD_APPROVAL` | *Chờ admin duyệt* | - |
| `AWAITING_COD_PAYMENT` | Thanh toán phí COD | Dispatcher Dashboard |
| `ON_GOING_COD` | Xác nhận hoàn tất COD | Dispatcher Dashboard |
| `PROCESSING` | *Chờ depot xử lý* | - |
| `COD_REJECTED` | *Yêu cầu bị từ chối* | - |
| `COMPLETED` | *Hoàn tất* | - |

## 📊 Expected Behavior

### Trước khi Fix:
- ❌ Admin duyệt COD → `cod_requests` cập nhật, `import_containers` KHÔNG cập nhật
- ❌ Container status luôn ở `AVAILABLE` hoặc `AWAITING_COD_APPROVAL`

### Sau khi Fix:
- ✅ Admin duyệt COD → Cả `cod_requests` VÀ `import_containers` đều cập nhật đúng
- ✅ Container status theo đúng luồng 6 giai đoạn
- ✅ UI hiển thị action buttons phù hợp với từng status

## 🔧 Troubleshooting

### Nếu gặp enum error "CONTAINER_STATUS_UPDATED":
```
ERROR: invalid input value for enum audit_log_action: "CONTAINER_STATUS_UPDATED"
```
**Giải pháp**: Chạy `fix_audit_enum_error.sql` để fix trigger function

### Nếu container status vẫn sai:
1. Chạy lại `test_cod_flow.sql` để identify issues
2. Check audit logs để xem có trigger nào ghi đè status không
3. Restart application để clear cache

### Nếu action buttons không hiện:
1. Check user role và permissions
2. Verify container status trong database
3. Check console logs cho API errors

### Nếu stored functions không hoạt động:
1. Check function permissions: `GRANT EXECUTE ON FUNCTION approve_cod_request TO authenticated;`
2. Verify RLS policies cho cod_requests và import_containers tables
3. Check database logs cho specific error messages

## 📋 Testing Checklist

- [ ] Submit COD request → Container status: `AWAITING_COD_APPROVAL`
- [ ] Admin approve → Container status: `AWAITING_COD_PAYMENT`
- [ ] Admin reject → Container status: `COD_REJECTED`
- [ ] Payment confirm → Container status: `ON_GOING_COD`
- [ ] Completion confirm → Container status: `PROCESSING`
- [ ] Depot completion → Container status: `COMPLETED`
- [ ] UI action buttons hiển thị đúng cho từng status
- [ ] Loading states hoạt động khi click actions
- [ ] Audit logs ghi nhận đầy đủ status changes

## 🎉 Kết quả mong đợi

Sau khi áp dụng fix này:
1. **COD Status Flow hoàn chỉnh** từ A-Z
2. **Container status đồng bộ** với COD request status
3. **UI/UX nhất quán** với action buttons phù hợp
4. **Audit trail đầy đủ** cho debugging
5. **Performance tối ưu** với stored functions và triggers 