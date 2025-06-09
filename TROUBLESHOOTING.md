# 🔧 Hướng Dẫn Khắc Phục Sự Cố - i-ContainerHub@LTA

## 🗄️ 1. Sửa Lỗi Sample Data SQL

### ❌ Vấn đề
File `sample_data.sql` báo lỗi về cột `id` khi chạy trên SQL Editor.

### ✅ Giải pháp
File đã được cập nhật để sử dụng UUID đúng format. Chạy các lệnh sau:

1. **Chạy database schema trước**:
```sql
-- Chạy file "DB Setup.sql" trước
```

2. **Chạy sample data**:
```sql
-- Chạy file "sample_data.sql" đã được sửa
```

3. **Kiểm tra data đã insert thành công**:
```sql
-- Kiểm tra organizations
SELECT o.name, o.type FROM organizations o ORDER BY o.type, o.name;

-- Kiểm tra containers và bookings
SELECT ic.container_number, o1.name as trucking, o2.name as shipping 
FROM import_containers ic
JOIN organizations o1 ON ic.trucking_company_org_id = o1.id
JOIN organizations o2 ON ic.shipping_line_org_id = o2.id;
```

---

## 🔐 2. Sửa Lỗi Đăng Ký Tài Khoản

### ❌ Các lỗi thường gặp trong console:

1. **404 Errors**: Failed to load resources
2. **Hydration Mismatch**: SSR/CSR không khớp
3. **Connection Errors**: Không kết nối được Supabase
4. **RLS Errors**: Row Level Security chặn truy cập

### ✅ Các bước khắc phục:

#### Bước 1: Kiểm tra Environment Variables
Đảm bảo file `.env.local` có đầy đủ thông tin:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Bước 2: Kiểm tra Supabase Database
1. Vào Supabase Dashboard → Table Editor
2. Kiểm tra các bảng đã được tạo:
   - `organizations`
   - `profiles`
   - `import_containers`
   - `export_bookings`
   - `street_turn_requests`

#### Bước 3: Kiểm tra RLS Policies
Đảm bảo RLS policies đã được setup đúng:

```sql
-- Kiểm tra RLS đã bật chưa
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Kiểm tra policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### Bước 4: Kiểm tra Auth Trigger
Đảm bảo trigger auto-create profile đã hoạt động:

```sql
-- Kiểm tra trigger function
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Kiểm tra trigger
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 🧪 3. Testing Registration Process

### Form Registration có Debug Mode
RegisterForm mới đã thêm debug info để trace lỗi:

1. **Connection Test**: Kiểm tra kết nối Supabase
2. **Permission Test**: Kiểm tra quyền truy cập database
3. **Step-by-step Tracking**: Theo dõi từng bước đăng ký

### Test Scenarios:

#### Test 1: Đăng ký Dispatcher (Công ty Vận tải)
```
Họ tên: Nguyễn Văn A
Công ty: Công ty Vận tải ABC
Loại: Công ty Vận tải
Email: dispatcher@vantai-abc.com
Mật khẩu: 123456
```

#### Test 2: Đăng ký Carrier Admin (Hãng tàu)
```
Họ tên: Trần Thị B
Công ty: Hãng tàu XYZ
Loại: Hãng tàu
Email: admin@hangtau-xyz.com
Mật khẩu: 123456
```

---

## 🚫 4. Các Lỗi Phổ Biến và Cách Sửa

### Lỗi: "Database permission error"
```bash
Nguyên nhân: RLS chặn anonymous access
Giải pháp: Kiểm tra RLS policies hoặc tạm thời disable RLS để test
```

### Lỗi: "User already registered"
```bash
Nguyên nhân: Email đã tồn tại
Giải pháp: Sử dụng email khác hoặc xóa user cũ trong Supabase Auth
```

### Lỗi: "Organization check failed"
```bash
Nguyên nhân: Không thể query organizations table
Giải pháp: Kiểm tra RLS policy cho organizations table
```

### Lỗi: "Failed to create organization"
```bash
Nguyên nhân: Không có quyền INSERT vào organizations
Giải pháp: Cần setup policy cho anonymous users để create organization
```

---

## 🔧 5. Quick Fixes

### Fix 1: Temporary Disable RLS for Testing
```sql
-- Tạm thời tắt RLS để test (KHÔNG dùng trong production)
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

### Fix 2: Enable Anonymous Organization Creation
```sql
-- Cho phép anonymous users tạo organization
CREATE POLICY "Allow anonymous organization creation"
ON public.organizations FOR INSERT
TO anon
WITH CHECK (true);
```

### Fix 3: Clear Auth Users for Testing
```sql
-- Xóa test users (chỉ dùng trong development)
DELETE FROM auth.users WHERE email LIKE '%test%';
```

---

## 📋 6. Verification Checklist

### ✅ Database Setup
- [ ] Schema được tạo thành công (enums, tables, functions)
- [ ] RLS được enable và policies được tạo
- [ ] Trigger handle_new_user hoạt động
- [ ] Sample data được insert thành công

### ✅ Environment Setup
- [ ] .env.local có đầy đủ Supabase credentials
- [ ] npm run dev chạy thành công
- [ ] Supabase connection test passed

### ✅ Registration Flow
- [ ] Form hiển thị debug info
- [ ] Connection test thành công
- [ ] Permission test thành công
- [ ] User creation thành công
- [ ] Profile creation thành công
- [ ] Redirect về dashboard thành công

---

## 🆘 7. Liên Hệ Hỗ Trợ

Nếu vẫn gặp vấn đề, hãy cung cấp:

1. **Error message** đầy đủ từ console
2. **Debug info** từ registration form
3. **Screenshots** của Supabase dashboard
4. **Environment** details (Node version, OS, etc.)

---

## 📚 8. Tài Liệu Tham Khảo

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
- [PostgreSQL UUID Functions](https://www.postgresql.org/docs/current/uuid-ossp.html) 