# 🧪 Hướng dẫn Test COD Payment Flow

## 📊 **Bước 1: Kiểm tra Database Schema**

### 1.1 Chạy script debug trước:
```sql
-- Chạy file: debug_schema_check.sql
-- Kiểm tra các bảng và relationships hiện tại
```

### 1.2 Chạy script fix (CẬP NHẬT):
```sql
-- Chạy file: fix_cod_payment_schema.sql
-- Script này sẽ:
-- ✅ Tạo bảng gpg_depots với test data
-- ✅ Drop constraint cũ pointing to depots
-- ✅ Tạo constraint mới pointing to gpg_depots
-- ✅ Migrate tất cả existing COD requests
-- ✅ Chuyển 1 APPROVED request thành PENDING_PAYMENT
-- ✅ Tạo thêm 1 COD request PENDING_PAYMENT mới
```

### 1.3 Tạo prepaid fund test data:
```sql
-- Chạy file: create_prepaid_fund_test_data.sql
-- Script này sẽ:
-- ✅ Tạo quỹ prepaid cho TRUCKING_COMPANY (3M VNĐ)
-- ✅ Tạo quỹ prepaid cho other orgs (1M VNĐ)
-- ✅ Tạo lịch sử giao dịch mẫu
-- ✅ Tạo QR codes test
```

### 1.4 Verify migration:
```sql
-- Chạy file: verify_migration_status.sql
-- Kiểm tra tất cả đã setup đúng chưa
-- Kết quả mong muốn: "🎉 READY FOR TESTING"
```

---

## 🔐 **Bước 2: Login và Access**

### 2.1 Login với tài khoản DISPATCHER:
- Role: `DISPATCHER` 
- Organization type: `TRUCKING_COMPANY`

### 2.2 Kiểm tra permissions:
- Vào `/billing` - phải access được
- Vào `/dispatcher/requests` - phải access được

---

## 💳 **Bước 3: Test Billing Dashboard**

### 3.1 Navigate to Billing page:
```
URL: /billing
```

### 3.2 Kiểm tra UI Components:

#### ✅ **Summary Cards (5 cards):**
1. **Tổng Hóa Đơn** - hiển thị số lượng invoices
2. **Giao Dịch Chưa Thanh Toán** - hiển thị unpaid transactions  
3. **Phí COD** - hiển thị pending COD payments *(MỚI)*
4. **Quỹ i-Prepaid** - hiển thị số dư quỹ *(MỚI)*
5. **Tổng Chi Phí** - hiển thị tổng chi phí

#### ✅ **Data Tables:**
1. **Hóa Đơn Gần Đây** (Invoices)
2. **Giao Dịch Chưa Thanh Toán** (Unpaid Transactions)  
3. **Phí COD Chờ Thanh Toán** (Pending COD Payments) *(MỚI)*

### 3.3 Kiểm tra "Phí COD Chờ Thanh Toán" section:

#### Dữ liệu hiển thị:
- **Container**: Số container
- **Tổ chức yêu cầu**: Tên company  
- **Depot gốc**: Địa chỉ depot ban đầu
- **Depot mới**: Tên GPG depot đã chọn
- **Phí COD**: Số tiền phải trả
- **Thời gian**: Thời gian delivery confirmed
- **Nút Thanh toán**: Button "Thanh toán ngay" *(QUAN TRỌNG)*

#### ❌ **Troubleshooting nếu không thấy data:**
```sql
-- 1. Kiểm tra migration status
\i verify_migration_status.sql

-- 2. Nếu constraint vẫn point to depots:
ALTER TABLE cod_requests DROP CONSTRAINT cod_requests_requested_depot_id_fkey;
ALTER TABLE cod_requests ADD CONSTRAINT cod_requests_requested_depot_id_fkey 
FOREIGN KEY (requested_depot_id) REFERENCES gpg_depots(id);

-- 3. Nếu không có PENDING_PAYMENT requests:
UPDATE cod_requests 
SET status = 'PENDING_PAYMENT', 
    delivery_confirmed_at = NOW() - INTERVAL '1 hour'
WHERE status = 'APPROVED' AND cod_fee > 0 
LIMIT 2;
```

---

## 🎯 **Bước 4: Test COD Payment Dialog**

### 4.1 Click nút "Thanh toán ngay":
- Dialog "Thanh toán phí COD" sẽ mở
- Hiển thị thông tin COD request đầy đủ

### 4.2 Test Tab "Chuyển khoản VietQR":

#### Features cần test:
- ✅ **QR Code generation**: QR hiển thị đúng
- ✅ **Bank info**: Thông tin ngân hàng LienVietPostBank
- ✅ **Amount**: Số tiền chính xác
- ✅ **Transfer content**: Nội dung chuyển khoản có mã COD
- ✅ **Expiry time**: Countdown 15 phút
- ✅ **Download QR**: Nút download QR code
- ✅ **Enlarge QR**: Click vào QR để phóng to

#### Action buttons:
- ✅ **"Đã chuyển khoản"**: Mark as transferred
- ✅ **"Hủy"**: Close dialog

### 4.3 Test Tab "Thanh toán bằng Quỹ i-Prepaid":

#### Scenario A - Đủ số dư:
- ✅ **Balance display**: Hiển thị số dư hiện tại  
- ✅ **Payment amount**: Hiển thị số tiền cần trả
- ✅ **"Thanh toán ngay"**: Button xanh, enabled
- ✅ **Payment success**: Toast success, dialog close, data refresh

#### Scenario B - Không đủ số dư:
- ✅ **Insufficient warning**: Cảnh báo số dư không đủ
- ✅ **"Nạp tiền ngay"**: Button đỏ
- ✅ **Top-up dialog**: Mở TopUpDialog

---

## 💰 **Bước 5: Test Top-Up Dialog**

### 5.1 Open Top-up dialog:
- Click "Nạp tiền ngay" từ COD Payment Dialog
- Hoặc click "Nạp tiền" từ summary card

### 5.2 Test predefined amounts:
- ✅ **500K, 1M, 2M, 5M, 10M**: Click các nút số tiền có sẵn
- ✅ **"Số tiền khác"**: Nhập custom amount
- ✅ **Amount validation**: Min 10K, max 100M

### 5.3 Test QR generation:
- ✅ **"Tạo QR Nạp Tiền"**: Generate QR thành công
- ✅ **QR details**: Bank info, amount, transfer content đúng
- ✅ **OneStop Logo**: Logo hiển thị đẹp
- ✅ **QR expiry**: 15 phút countdown

### 5.4 Test confirmation flow:
- ✅ **"Đã chuyển khoản"**: Confirm transfer
- ✅ **Admin notification**: (Cần admin test)
- ✅ **Balance update**: (Sau khi admin approve)

---

## 🔄 **Bước 6: Test End-to-End Flow**

### 6.1 Complete COD Payment with Prepaid Fund:
```
1. Billing Dashboard → Click "Thanh toán ngay"
2. COD Payment Dialog → Tab "Quỹ i-Prepaid"  
3. Check balance → Click "Thanh toán ngay"
4. Success toast → Dialog closes
5. Data refreshes → COD status = "PAID"
6. Check fund balance → Decreased by COD fee
7. Check fund transactions → New PAYMENT record
```

### 6.2 Complete COD Payment with VietQR:
```
1. Billing Dashboard → Click "Thanh toán ngay"
2. COD Payment Dialog → Tab "VietQR"
3. QR generates → Download/screenshot QR
4. Mock bank transfer → Click "Đã chuyển khoản"
5. (Admin verifies) → Status updates to PAID
```

### 6.3 Complete Top-up Flow:
```
1. Any payment screen → Click "Nạp tiền"
2. Select amount → Click "Tạo QR Nạp Tiền"
3. QR generates → Mock transfer → Click "Đã chuyển khoản"  
4. (Admin confirms) → Balance increases
5. Return to payment → Retry COD payment
```

---

## 🐛 **Common Issues & Solutions**

### Issue 1: "Could not find relationship"
```sql
-- Run fix script
\i fix_cod_payment_schema.sql
```

### Issue 2: No payment buttons visible
```sql
-- Check COD requests data
SELECT * FROM cod_requests WHERE status = 'PENDING_PAYMENT';

-- Create test data if needed
UPDATE cod_requests SET status = 'PENDING_PAYMENT', cod_fee = 500000 WHERE id = 'ID';
```

### Issue 3: No prepaid fund balance  
```sql
-- Run prepaid fund test data script
\i create_prepaid_fund_test_data.sql
```

### Issue 4: QR code not generating
- Check browser console for errors
- Verify `qrcode.react` package installed
- Check network requests in DevTools

### Issue 5: UI components not showing
- Check React component imports  
- Verify Tailwind CSS classes
- Check browser console for TypeScript errors

---

## ✅ **Test Checklist**

- [ ] Database schema fixed and relationships working
- [ ] Test data created (COD requests + prepaid funds)
- [ ] Billing dashboard loads without errors
- [ ] "Phí COD Chờ Thanh Toán" section shows data
- [ ] "Thanh toán ngay" buttons visible and clickable
- [ ] COD Payment Dialog opens correctly
- [ ] VietQR tab generates QR codes
- [ ] Prepaid Fund tab shows balance correctly
- [ ] Top-up dialog works end-to-end
- [ ] Payment with sufficient balance succeeds  
- [ ] Payment with insufficient balance shows top-up option
- [ ] Data refreshes after successful payment
- [ ] QR codes are downloadable and enlargeable
- [ ] OneStop logo displays correctly
- [ ] All toasts and error messages work
- [ ] Responsive design works on mobile

---

## 📱 **Mobile Testing**

- [ ] All dialogs responsive on mobile screens
- [ ] QR codes properly sized for mobile
- [ ] Touch interactions work smoothly  
- [ ] Text readable on small screens
- [ ] Buttons properly sized for touch

---

## 🎉 **Success Criteria**

✅ **Primary Flow**: User có thể thanh toán COD fee bằng prepaid fund hoặc VietQR

✅ **Top-up Flow**: User có thể nạp tiền vào quỹ khi số dư không đủ

✅ **Admin Flow**: Admin có thể approve top-up requests (future development)

✅ **UX**: Toàn bộ flow mượt mà, responsive, và user-friendly 