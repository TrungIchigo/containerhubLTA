# Fix: User Switching & Fund Data Persistence Issue

## Vấn đề (Problem)

Khi user login vào account khác, dữ liệu fund (quỹ prepaid và eDepot wallet) vẫn hiển thị thông tin của account trước đó thay vì được clear và load lại cho user mới.

## Nguyên nhân (Root Cause)

Các component `CodPaymentDialog` và `TopUpDialog` không track user changes, dẫn đến:
- State của fund data không được clear khi user thay đổi
- API calls không được trigger lại cho user mới
- Dữ liệu cũ vẫn persist trong component state

## Giải pháp (Solution)

### 1. Thêm User Context Tracking với Auto-Reload

**File:** `src/components/features/cod/CodPaymentDialog.tsx`
```typescript
// Thêm import
import { useUser } from '@/hooks/use-user'

// Thêm user hook
const { user } = useUser()

// Thêm effect để clear state khi user thay đổi VÀ reload nếu dialog đang mở
useEffect(() => {
  if (user?.id) {
    console.log('🔄 User changed, clearing fund data state and reloading if dialog is open')
    setPrepaidFund(null)
    setEDepotWalletData(null)
    setQrCodeInfo(null)
    setActiveTab('qr_code')
    setTopUpDialogOpen(false)
    
    // If dialog is currently open, reload the data for the new user
    if (open) {
      console.log('🔄 Dialog is open, reloading fund data for new user')
      loadPrepaidFund()
      if (payment) {
        generateQRCode()
      }
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.id])
```

**File:** `src/components/features/cod/TopUpDialog.tsx`
```typescript
// Tương tự như CodPaymentDialog với auto-reload
import { useUser } from '@/hooks/use-user'

const { user } = useUser()

useEffect(() => {
  if (user?.id) {
    console.log('🔄 TopUpDialog: User changed, clearing fund data state and reloading if dialog is open')
    setPrepaidFund(null)
    setQrCodeInfo(null)
    setStep('amount')
    setSelectedAmount(1000000)
    setCustomAmount('')
    
    // If dialog is currently open, reload the data for the new user
    if (open) {
      console.log('🔄 TopUpDialog: Dialog is open, reloading fund data for new user')
      loadPrepaidFund()
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user?.id])
```

### 2. Fix Date Formatting Issues

Sửa lỗi `Invalid time value` khi format date:

```typescript
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
  } catch (error) {
    return 'N/A'
  }
}
```

## Testing

### Test Page 1: `/test-user-switching`

Test page cơ bản để verify user switching:
- Hiển thị thông tin user hiện tại
- Button để mở CodPaymentDialog
- Test log để track các events
- Hướng dẫn test step-by-step

### Test Page 2: `/test-fund-reload` (RECOMMENDED)

Test page nâng cao với simulation và detailed logging:
- Real-time user information display
- Controls để test cả Payment Dialog và TopUp Dialog
- Simulate user change functionality
- Comprehensive test log với timestamps
- Detailed testing instructions
- Expected behavior documentation

### Các bước test (sử dụng `/test-fund-reload`):

1. **Đăng nhập và load initial data**
   - Truy cập `/test-fund-reload`
   - Verify user info hiển thị đúng
   - Mở Payment Dialog hoặc TopUp Dialog
   - Kiểm tra fund data được load (xem console logs)
   - Đóng dialog

2. **Simulate user change**
   - Click "Simulate User Change" button
   - Kiểm tra test log thấy user change event
   - Mở lại dialog
   - Verify console logs hiển thị:
     - "User changed, clearing fund data state and reloading if dialog is open"
     - "Dialog is open, reloading fund data for new user"

3. **Verify data reload behavior**
   - Fund data được clear và reload cho "user mới"
   - Không còn hiển thị data cũ
   - API calls được trigger lại

### Real User Switching Test:

1. **Đăng nhập account A**
   - Truy cập test page
   - Mở dialog và load fund data
   - Note fund data của account A

2. **Chuyển sang account B**
   - Sign out account A
   - Đăng nhập account B
   - Kiểm tra console logs thấy user change events

3. **Verify fund data được clear và reload**
   - Mở lại dialog
   - Verify fund data hiển thị cho account B (không phải account A)
   - Kiểm tra API calls được trigger cho user mới

## Console Logs để Debug

Khi fix hoạt động đúng, sẽ thấy các logs:

```
🔄 User changed, clearing fund data state
🔄 TopUpDialog: User changed, clearing fund data state
✅ eDepot API Response received successfully
💰 eDepot Wallet Data: { walletCode: 'LP0020434', balance: '100.000 VNĐ' }
```

## Files Changed

1. `src/components/features/cod/CodPaymentDialog.tsx`
   - Thêm useUser hook
   - Thêm useEffect để clear state khi user thay đổi VÀ auto-reload nếu dialog đang mở
   - Fix formatDate function để handle null/undefined dates
   - Thêm comprehensive logging

2. `src/components/features/cod/TopUpDialog.tsx`
   - Thêm useUser hook
   - Thêm useEffect để clear state khi user thay đổi VÀ auto-reload nếu dialog đang mở
   - Fix formatDate function để handle null/undefined dates
   - Thêm comprehensive logging

3. `src/app/test-user-switching/page.tsx` (NEW)
   - Basic test page để verify fix
   - UI để demo user switching
   - Test log và hướng dẫn

4. `src/app/test-fund-reload/page.tsx` (NEW)
   - Advanced test page với simulation capabilities
   - Real-time user info display
   - Controls để test cả Payment và TopUp dialogs
   - Simulate user change functionality
   - Comprehensive test logging với timestamps
   - Detailed testing instructions và expected behavior

## Verification

✅ **Fixed:** Fund data được clear khi user thay đổi
✅ **Fixed:** Date formatting errors
✅ **Added:** User context tracking trong payment components
✅ **Added:** Test page để verify functionality
✅ **Added:** Console logging để debug

## Impact

- **Security:** Ngăn chặn data leakage giữa các user accounts
- **UX:** User thấy đúng fund data của account mình
- **Reliability:** Đảm bảo API flow chạy đúng theo design
- **Debugging:** Thêm logs để dễ dàng troubleshoot

## Next Steps

1. Test trên production environment
2. Monitor console logs để đảm bảo không có regression
3. Consider thêm loading states khi switch user
4. Review các components khác có thể có vấn đề tương tự