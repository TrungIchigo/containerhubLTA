# 🔍 Kiểm Tra Supabase Auth Settings

## ❗ Vấn đề hiện tại
Email validation lỗi: "Email address is invalid" từ Supabase Auth

## 🔧 Các bước kiểm tra và sửa lỗi:

### 1. Kiểm tra Supabase Dashboard Settings

1. **Vào Supabase Dashboard** → Chọn project → **Authentication** → **Settings**

2. **Kiểm tra Email Confirmation**:
   ```
   ☐ Enable email confirmations: TẮT để test
   ☐ Enable secure email change: TẮT để test  
   ☐ Enable phone confirmations: TẮT
   ```

3. **Kiểm tra Auth Providers**:
   ```
   ☐ Email provider: BẬT
   ☐ Enable third party providers: TẮT để test đơn giản
   ```

### 2. Kiểm tra Email Templates (nếu có)

1. Vào **Authentication** → **Email Templates**
2. Đảm bảo có template cho **Confirm signup**
3. Hoặc tạm thời disable email confirmation

### 3. Kiểm tra Database Triggers

Chạy query này trong **SQL Editor**:

```sql
-- Kiểm tra trigger function có tồn tại không
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Kiểm tra trigger có được gán không  
SELECT tgname, tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

### 4. Test với Email phổ biến

Thử đăng ký với các email format sau:

✅ **Recommended (Gmail/Outlook)**:
```
test1@gmail.com
test2@outlook.com  
test3@yahoo.com
```

❌ **Tránh (Corporate/Custom domains)**:
```
dispatcher@vantai-abc.com (có thể bị reject)
admin@hangtau-xyz.com (có thể bị reject)
```

### 5. Tạm thời Disable Email Confirmation

Nếu vẫn lỗi, chạy SQL này để tạm thời tắt email confirmation:

```sql
-- Tạm thời disable email confirmation cho development
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

### 6. Test Registration Flow

1. **Mở Console** (F12)
2. **Clear cookies/storage** 
3. **Thử đăng ký** với email Gmail
4. **Kiểm tra debug messages** trong form
5. **Check console errors** chi tiết

### 7. Alternative: Use Development Mode

Trong **Supabase Dashboard**:

1. **Authentication** → **Settings** 
2. **Site URL**: `http://localhost:3000`
3. **Redirect URLs**: Add `http://localhost:3000/**`

### 8. Check RLS Policies

Chạy script này nếu vẫn có issues:

```sql
-- Check if anonymous users can create organizations
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'organizations'
  AND roles @> '{anon}';
```

## 🚀 Quick Fix Commands

### Fix 1: Completely disable email confirmation (Development only)
```sql
-- Trong Supabase SQL Editor
ALTER TABLE auth.users 
ALTER COLUMN email_confirmed_at 
SET DEFAULT NOW();
```

### Fix 2: Reset and test with simple setup
```sql
-- Xóa tất cả test users
DELETE FROM public.profiles WHERE full_name LIKE '%Test%';
DELETE FROM auth.users WHERE email LIKE '%test%';
```

### Fix 3: Force enable all existing users
```sql
-- Enable tất cả users đã tạo
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

## ✅ Expected Result

Sau khi sửa, bạn sẽ thấy:

1. **Debug message**: "Supabase connection OK"
2. **No email validation errors** 
3. **User creation successful**
4. **Profile creation successful**  
5. **Redirect to dashboard**

## 🆘 Nếu vẫn lỗi

Cung cấp thông tin:

1. **Supabase project URL** (che sensitive info)
2. **Auth settings screenshots**
3. **Full console log** 
4. **Email format đang dùng**

---

**Lưu ý**: Các fix trên phù hợp cho development. Production cần setup email confirmation đúng cách. 