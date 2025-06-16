# Supabase Storage Setup - Hướng Dẫn Chi Tiết

## 🎯 Mục tiêu
Tạo và cấu hình Supabase Storage buckets để lưu trữ:
- Hình ảnh tình trạng container
- Chứng từ đính kèm (PDF, DOC, etc.)

## 📋 Bước 1: Truy cập Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Từ sidebar, chọn **"Storage"**

## 📋 Bước 2: Tạo Buckets

### 2.1 Tạo Bucket cho Container Images

1. Click **"New bucket"**
2. Điền thông tin:
   - **Name**: `container-images`
   - **Public bucket**: ✅ **Bật** (để có thể truy cập public URLs)
   - **File size limit**: `50MB` (tùy chọn)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/heic`

3. Click **"Create bucket"**

### 2.2 Tạo Bucket cho Documents

1. Click **"New bucket"**
2. Điền thông tin:
   - **Name**: `documents`
   - **Public bucket**: ✅ **Bật**
   - **File size limit**: `100MB`
   - **Allowed MIME types**: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png`

3. Click **"Create bucket"**

## 📋 Bước 3: Cấu hình RLS Policies

### 3.1 Policies cho `container-images` bucket

Vào **Storage** > **Policies** > **container-images**, tạo các policies:

#### Policy 1: Allow authenticated users to upload
```sql
-- Policy Name: Allow authenticated users to upload images
-- Operation: INSERT
-- Target roles: authenticated

-- Check expression:
auth.role() = 'authenticated'

-- With check:
auth.role() = 'authenticated' AND bucket_id = 'container-images'
```

#### Policy 2: Allow public read access
```sql
-- Policy Name: Allow public read access to images
-- Operation: SELECT
-- Target roles: public, authenticated

-- Check expression:
true

-- With check:
bucket_id = 'container-images'
```

#### Policy 3: Allow owners to delete their images
```sql
-- Policy Name: Allow owners to delete their images
-- Operation: DELETE
-- Target roles: authenticated

-- Check expression:
auth.uid()::text = (storage.foldername(name))[1]

-- With check:
bucket_id = 'container-images' AND auth.uid()::text = (storage.foldername(name))[1]
```

### 3.2 Policies cho `documents` bucket

Tương tự, tạo policies cho `documents` bucket:

```sql
-- Upload policy
auth.role() = 'authenticated' AND bucket_id = 'documents'

-- Read policy  
bucket_id = 'documents'

-- Delete policy
auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'documents'
```

## 📋 Bước 4: Thiết lập File Organization

### 4.1 Cấu trúc thư mục đề xuất:

```
container-images/
├── {user_id}/
│   ├── {container_id}/
│   │   ├── condition_1.jpg
│   │   ├── condition_2.jpg
│   │   └── condition_3.jpg
│   └── ...

documents/
├── {user_id}/
│   ├── {container_id}/
│   │   ├── shipping_manifest.pdf
│   │   ├── customs_declaration.pdf
│   │   └── inspection_report.docx
│   └── ...
```

## 📋 Bước 5: Kiểm tra Environment Variables

Đảm bảo file `.env.local` có các biến sau:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📋 Bước 6: Test Upload từ Dashboard

1. Vào **Storage** > **container-images**
2. Click **"Upload file"**
3. Chọn một hình ảnh test
4. Verify upload thành công
5. Copy public URL để test

## ⚙️ Storage Settings Khuyến nghị

### Security Settings:
- ✅ Enable RLS trên tất cả buckets
- ✅ Restrict file types theo MIME types
- ✅ Set reasonable file size limits
- ✅ Use folder-based organization

### Performance Settings:
- ✅ Enable CDN cho faster delivery
- ✅ Set up image transformations (optional)
- ✅ Configure automatic cleanup policies

## 🚨 Lưu ý quan trọng

1. **File Naming**: Sử dụng UUID hoặc timestamp để tránh conflict
2. **Security**: Luôn validate file types trước khi upload
3. **Cleanup**: Implement logic để xóa files khi xóa records
4. **Backup**: Consider backup strategy cho production data
5. **Monitoring**: Monitor storage usage và costs

## 📱 Test Connection Code

Sau khi setup, test với code sau:

```javascript
import { createClient } from '@/lib/supabase/client'

const testUpload = async () => {
  const supabase = createClient()
  
  // Test upload
  const { data, error } = await supabase.storage
    .from('container-images')
    .upload('test/sample.jpg', file)
    
  if (error) {
    console.error('Upload failed:', error)
  } else {
    console.log('Upload success:', data)
  }
}
```

---

**✅ Hoàn thành setup khi:**
- [ ] 2 buckets được tạo thành công
- [ ] RLS policies được cấu hình
- [ ] Test upload thành công từ dashboard
- [ ] Public URLs accessible
- [ ] Environment variables configured 