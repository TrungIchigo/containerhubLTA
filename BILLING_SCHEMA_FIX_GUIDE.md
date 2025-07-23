# Billing Schema Fix Guide

## 🚨 Vấn đề
Lỗi: `"column organizations_1.organization_type does not exist"`

## 🔍 Nguyên nhân
Code đang query column `organization_type` không tồn tại trong bảng `organizations`. Column đúng là `type`.

## ✅ Giải pháp đã Fix

### 1. **Cập nhật Queries** (đã fix trong code)
- ✅ Fixed `getInvoices()` function
- ✅ Fixed `getUnpaidTransactions()` function  
- ✅ Updated TypeScript types

### 2. **Thay đổi chi tiết:**
```typescript
// ❌ Trước đây (sai)
organization_type

// ✅ Bây giờ (đúng)  
type
```

## 🧪 Cách Test Fix

### Bước 1: Verify Database Schema
```bash
psql -d your_database -f verify_organizations_schema.sql
```

### Bước 2: Test Billing Dashboard
1. Vào `/billing` hoặc `/admin/billing`
2. Check console không còn errors
3. Invoices và transactions load thành công

## 🎯 Expected Results

### Trước khi fix:
- ❌ Error: `column organizations_1.organization_type does not exist`
- ❌ Billing dashboard không load được data

### Sau khi fix:
- ✅ Billing queries chạy thành công
- ✅ Invoices và transactions hiển thị đúng
- ✅ Organization names hiển thị trong billing data

## 🔧 Troubleshooting

### Nếu vẫn lỗi:
1. **Check organizations table có column `type`:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'organizations' AND column_name = 'type';
   ```

2. **Nếu không có column `type`, tạo nó:**
   ```sql
   ALTER TABLE public.organizations ADD COLUMN type TEXT;
   UPDATE public.organizations SET type = 'TRUCKING_COMPANY' WHERE name LIKE '%Trucking%';
   -- Update other types as needed
   ```

3. **Restart application** để clear cache

### Kiểm tra data:
```sql
SELECT id, name, type FROM public.organizations LIMIT 5;
```

## 📋 Files đã fix:
- ✅ `src/lib/actions/billing.ts` - Updated queries
- ✅ `src/lib/types/billing.ts` - Updated TypeScript types
- ✅ `verify_organizations_schema.sql` - Database verification script

## 🎉 Kết quả
Billing dashboard sẽ hoạt động bình thường với:
- Invoices list đầy đủ organization names
- Transactions list với payer organization info
- Billing stats và summary chính xác 