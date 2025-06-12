# Hướng Dẫn Test Authentication và Dispatcher Dashboard

## Yêu Cầu Chuẩn Bị

1. **Database Setup**: Đảm bảo database đã được tạo theo `DB Setup.sql`
2. **Environment Variables**: Cấu hình file `.env.local` với Supabase credentials
3. **Sample Data**: Chạy script `sample_data.sql` để tạo dữ liệu mẫu

## Test Authentication (Đăng Ký & Đăng Nhập)

### Test 1: Đăng Ký Dispatcher Mới
1. Truy cập `http://localhost:3000/register`
2. Điền thông tin:
   - **Họ và Tên**: Nguyễn Văn A
   - **Tên Công ty**: Công ty Vận tải ABC
   - **Loại hình tổ chức**: Công ty Vận tài
   - **Email**: dispatcher@vantai-abc.com
   - **Mật khẩu**: password123
3. Nhấn "Đăng Ký"
4. **Kết quả mong đợi**:
   - Tự động chuyển hướng đến `/dispatcher`
   - Profile được tạo với role = 'DISPATCHER'
   - Organization mới được tạo với type = 'TRUCKING_COMPANY'

### Test 2: Đăng Ký Carrier Admin Mới
1. Truy cập `http://localhost:3000/register`
2. Điền thông tin:
   - **Họ và Tên**: Trần Thị B
   - **Tên Công ty**: Hãng tàu XYZ
   - **Loại hình tổ chức**: Hãng tàu
   - **Email**: admin@hangtau-xyz.com
   - **Mật khẩu**: password123
3. Nhấn "Đăng Ký"
4. **Kết quả mong đợi**:
   - Tự động chuyển hướng đến `/carrier-admin`
   - Profile được tạo với role = 'CARRIER_ADMIN'
   - Organization mới được tạo với type = 'SHIPPING_LINE'

### Test 3: Đăng Nhập
1. Truy cập `http://localhost:3000/login`
2. Đăng nhập với email/password đã tạo ở Test 1 hoặc 2
3. **Kết quả mong đợi**:
   - Dispatcher: chuyển đến `/dispatcher`
   - Carrier Admin: chuyển đến `/carrier-admin`
   - Header hiển thị tên và organization đúng
   - Nút "Đăng xuất" hoạt động

## Test Dispatcher Dashboard

### Test 4: Xem Dashboard Tổng Quan
1. Đăng nhập với role DISPATCHER
2. Truy cập `/dispatcher`
3. **Kiểm tra**:
   - **KPI Cards** hiển thị đúng số liệu:
     - Container Sẵn Sàng: số container có status = 'AVAILABLE'
     - Booking Đang Chờ: số booking có status = 'AVAILABLE'  
     - Street-Turns Đã Duyệt: số request có status = 'APPROVED'
   - **Bảng Container Nhập**: hiển thị containers của organization
   - **Bảng Booking Xuất**: hiển thị bookings của organization
   - **Gợi Ý Ghép Nối**: hiển thị các cặp matching

### Test 5: Thêm Container Nhập Khẩu
1. Trong Dispatcher Dashboard, nhấn "Thêm Container Nhập"
2. Điền thông tin:
   - **Số Container**: TEST1234567
   - **Loại Container**: 20FT
   - **Hãng Tàu**: Chọn một hãng từ dropdown
   - **Địa Điểm Dỡ Hàng**: Cảng Cát Lái, TP.HCM
   - **Thời Gian Rảnh**: Chọn datetime trong tương lai
3. Nhấn "Lưu"
4. **Kết quả mong đợi**:
   - Dialog đóng
   - Container mới xuất hiện trong bảng
   - KPI Card "Container Sẵn Sàng" tăng +1

### Test 6: Thêm Booking Xuất Khẩu
1. Nhấn "Thêm Booking Xuất"
2. Điền thông tin:
   - **Số Booking**: TESTBKG123
   - **Loại Container Yêu Cầu**: 20FT
   - **Địa Điểm Lấy Hàng**: Khu CN Tân Thuận
   - **Thời Gian Cần**: Chọn datetime sau thời gian container rảnh
3. Nhấn "Lưu"
4. **Kết quả mong đợi**:
   - Dialog đóng
   - Booking mới xuất hiện trong bảng
   - KPI Card "Booking Đang Chờ" tăng +1
   - **Quan trọng**: Gợi ý ghép nối mới xuất hiện cho container và booking vừa tạo

### Test 7: Tạo Street-Turn Request
1. Trong bảng "Gợi Ý Ghép Nối", tìm cặp container-booking phù hợp
2. Nhấn "Tạo Yêu Cầu"
3. **Kết quả mong đợi**:
   - Gợi ý đó biến mất khỏi bảng
   - Status của container và booking thay đổi thành 'AWAITING_APPROVAL'
   - Badge màu vàng "Chờ duyệt" xuất hiện trong bảng quản lý

### Test 8: Validation và Error Handling
1. **Test form validation**:
   - Thử submit form rỗng → hiển thị lỗi "Vui lòng điền đầy đủ thông tin"
   - Thử đăng ký với email đã tồn tại → hiển thị lỗi phù hợp
2. **Test authorization**:
   - Truy cập `/dispatcher` khi chưa đăng nhập → redirect to `/login`
   - Truy cập `/dispatcher` với role CARRIER_ADMIN → redirect to `/login`

## Test Data và Database
```sql
-- Kiểm tra profile được tạo đúng
SELECT p.*, o.name as org_name, o.type as org_type 
FROM profiles p 
JOIN organizations o ON p.organization_id = o.id;

-- Kiểm tra containers và bookings
SELECT * FROM import_containers ORDER BY created_at DESC;
SELECT * FROM export_bookings ORDER BY created_at DESC;

-- Kiểm tra street-turn requests
SELECT * FROM street_turn_requests ORDER BY created_at DESC;
```

## Các Tình Huống Edge Cases

1. **Multiple users cùng organization**: Tạo 2 users cùng organization, kiểm tra họ thấy cùng data
2. **Timing logic**: Tạo booking cần container trước thời gian container rảnh → không có gợi ý
3. **Different container types**: Tạo container 20FT và booking 40FT → không có gợi ý
4. **Empty states**: Xóa hết data, kiểm tra các empty state messages

## Lưu Ý Debug

1. **Browser Console**: Kiểm tra console errors
2. **Network Tab**: Xem API calls và responses
3. **Supabase Dashboard**: Kiểm tra data trong database
4. **Server Logs**: Xem terminal output cho server errors

## Demo Flow Hoàn Chính

1. Đăng ký 2 accounts: 1 Dispatcher + 1 Carrier Admin
2. Dispatcher thêm 2-3 containers và 2-3 bookings
3. Tạo street-turn requests
4. Switch sang Carrier Admin để approve/decline (khi implement carrier dashboard)
5. Quay lại Dispatcher xem status updates 