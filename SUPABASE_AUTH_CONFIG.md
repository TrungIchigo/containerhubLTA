# Cấu hình Supabase Auth để khắc phục lỗi "User not allowed"

## Vấn đề
Khi sử dụng `supabaseAdmin.auth.admin.createUser()`, gặp lỗi:
```
Error creating Supabase user: AuthApiError: User not allowed
```

## Nguyên nhân
Lỗi này xảy ra khi Supabase Auth không được cấu hình để cho phép tạo user mới.

## Giải pháp

### 1. Truy cập Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Authentication** > **Settings**

### 2. Cấu hình Auth Settings
Trong phần **General**, đảm bảo các setting sau:

#### ✅ Allow new users to sign up
- **Bật** option này để cho phép tạo user mới
- Nếu tắt, chỉ có existing users mới có thể sign in

#### ✅ Confirm Email (Tùy chọn)
- **Tắt** nếu bạn muốn user có thể đăng nhập ngay mà không cần xác thực email
- **Bật** nếu bạn muốn user phải xác thực email trước khi đăng nhập

### 3. Kiểm tra Service Role Key
Đảm bảo trong `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Restart Development Server
Sau khi thay đổi cấu hình:
```bash
npm run dev
```

## Kiểm tra
Sau khi cấu hình xong, thử test lại eDepot authentication để đảm bảo user có thể được tạo thành công.

## Tham khảo
- [Supabase Auth General Configuration](https://supabase.com/docs/guides/auth/general-configuration)
- [Supabase Admin API](https://supabase.com/docs/reference/javascript/auth-admin-createuser)