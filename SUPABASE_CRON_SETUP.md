# 🕐 Supabase Cron Job Setup - COD Auto Expiration

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn thiết lập **Cron Job** trên Supabase để tự động xử lý các yêu cầu COD (Change of Destination) hết hạn sau 24 giờ.

## 🎯 Mục tiêu

- Tự động chuyển trạng thái yêu cầu COD từ `PENDING`/`AWAITING_INFO` → `EXPIRED`
- Rollback trạng thái container về `AVAILABLE`
- Ghi log audit cho việc hết hạn tự động
- Chạy mỗi giờ để đảm bảo xử lý kịp thời

## 🔧 Bước 1: Cài đặt pg_cron Extension

### 1.1 Truy cập Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Database** → **Extensions**

### 1.2 Kích hoạt pg_cron
1. Tìm kiếm `pg_cron` trong danh sách extensions
2. Click **Enable** để kích hoạt
3. Đợi vài giây để extension được cài đặt

## 📝 Bước 2: Tạo PostgreSQL Function

### 2.1 Chạy SQL Function
1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy và chạy nội dung file `SQL/expire_old_cod_requests.sql`
3. Verify function đã được tạo thành công:

```sql
-- Kiểm tra function đã tồn tại
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'expire_old_cod_requests';
```

### 2.2 Test Function (Optional)
```sql
-- Test chạy function thủ công
SELECT * FROM expire_old_cod_requests();
```

## ⏰ Bước 3: Thiết lập Cron Job

### 3.1 Tạo Cron Job
Trong **SQL Editor**, chạy câu lệnh sau để tạo cron job:

```sql
-- Tạo cron job chạy mỗi giờ
SELECT cron.schedule(
    'expire-cod-requests',           -- Job name
    '0 * * * *',                    -- Cron expression (every hour at minute 0)
    'SELECT expire_old_cod_requests();'  -- SQL command to execute
);
```

### 3.2 Cron Expression Explained
- `0 * * * *` = Chạy vào phút 0 của mỗi giờ
- Có thể thay đổi theo nhu cầu:
  - `*/30 * * * *` = Mỗi 30 phút
  - `0 */2 * * *` = Mỗi 2 giờ
  - `0 0 * * *` = Mỗi ngày lúc 00:00

### 3.3 Verify Cron Job
```sql
-- Kiểm tra cron job đã được tạo
SELECT * FROM cron.job WHERE jobname = 'expire-cod-requests';
```

## 🔍 Bước 4: Monitoring & Debugging

### 4.1 Xem Log Cron Job
```sql
-- Xem lịch sử chạy cron job (10 lần gần nhất)
SELECT 
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details 
WHERE jobid = (
    SELECT jobid FROM cron.job WHERE jobname = 'expire-cod-requests'
)
ORDER BY start_time DESC 
LIMIT 10;
```

### 4.2 Kiểm tra Function Logs
```sql
-- Xem logs của function (nếu có lỗi)
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%expire_old_cod_requests%'
ORDER BY last_exec_time DESC;
```

### 4.3 Monitoring Expired Requests
```sql
-- Xem các yêu cầu COD đã hết hạn trong 24h qua
SELECT 
    cr.id,
    cr.status,
    cr.expires_at,
    cr.updated_at,
    ic.container_number,
    org.name as requesting_org,
    cal.created_at as expired_at
FROM cod_requests cr
LEFT JOIN import_containers ic ON cr.dropoff_order_id = ic.id
LEFT JOIN organizations org ON cr.requesting_org_id = org.id
LEFT JOIN cod_audit_logs cal ON cr.id = cal.request_id AND cal.action = 'EXPIRED'
WHERE 
    cr.status = 'EXPIRED'
    AND cr.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY cr.updated_at DESC;
```

## 🛠️ Bước 5: Quản lý Cron Job

### 5.1 Tạm dừng Cron Job
```sql
-- Tạm dừng cron job
SELECT cron.unschedule('expire-cod-requests');
```

### 5.2 Cập nhật Cron Job
```sql
-- Xóa job cũ
SELECT cron.unschedule('expire-cod-requests');

-- Tạo job mới với schedule khác
SELECT cron.schedule(
    'expire-cod-requests',
    '*/30 * * * *',  -- Chạy mỗi 30 phút
    'SELECT expire_old_cod_requests();'
);
```

### 5.3 Xóa Cron Job hoàn toàn
```sql
-- Xóa cron job
SELECT cron.unschedule('expire-cod-requests');

-- Xóa function (nếu cần)
DROP FUNCTION IF EXISTS expire_old_cod_requests();
```

## 📊 Bước 6: Dashboard Monitoring (Optional)

### 6.1 Tạo View để theo dõi
```sql
-- Tạo view để dễ dàng monitor
CREATE OR REPLACE VIEW cod_expiration_stats AS
SELECT 
    DATE(cal.created_at) as date,
    COUNT(*) as expired_count,
    ARRAY_AGG(
        jsonb_build_object(
            'container', cal.details->>'container_number',
            'org', cal.details->>'requesting_org',
            'time', cal.created_at
        )
    ) as expired_details
FROM cod_audit_logs cal
WHERE cal.action = 'EXPIRED'
    AND cal.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(cal.created_at)
ORDER BY date DESC;
```

### 6.2 Query thống kê
```sql
-- Xem thống kê hết hạn theo ngày
SELECT * FROM cod_expiration_stats;

-- Tổng số yêu cầu hết hạn trong tháng
SELECT 
    COUNT(*) as total_expired_this_month,
    COUNT(DISTINCT DATE(created_at)) as days_with_expiration
FROM cod_audit_logs 
WHERE action = 'EXPIRED' 
    AND created_at > DATE_TRUNC('month', NOW());
```

## ⚠️ Lưu ý quan trọng

### 🔒 Security
- Function chạy với `SECURITY DEFINER` để có quyền cập nhật dữ liệu
- Chỉ `service_role` và `authenticated` users có thể execute function

### 🕐 Timezone
- Supabase sử dụng UTC timezone
- Đảm bảo `expires_at` được set đúng timezone

### 📈 Performance
- Function được optimize để xử lý batch
- Sử dụng index trên `expires_at` và `status` columns

### 🔄 Rollback
- Nếu có lỗi, có thể rollback bằng cách:
  1. Tạm dừng cron job
  2. Sửa lỗi trong function
  3. Test function thủ công
  4. Khởi động lại cron job

## 🎉 Hoàn thành!

Sau khi hoàn thành các bước trên, hệ thống sẽ tự động:
- ✅ Kiểm tra yêu cầu COD hết hạn mỗi giờ
- ✅ Chuyển trạng thái thành `EXPIRED`
- ✅ Rollback container về `AVAILABLE`
- ✅ Ghi log audit chi tiết
- ✅ Cung cấp monitoring và debugging tools

**Hệ thống COD của bạn giờ đây đã hoàn toàn tự động và vững chắc! 🚀** 