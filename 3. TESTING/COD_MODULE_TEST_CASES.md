# **COD Module - Test Cases Comprehensive**

**Module:** Change of Destination (COD) - Thay Đổi Nơi Giao Trả Container Rỗng  
**Version:** 1.0  
**Date:** 2025-01-27  
**Testing Scope:** Functional + Technical + Security + Performance

---

## **🎯 EXECUTIVE SUMMARY**

**Mục đích:** Đảm bảo module COD hoạt động chính xác, an toàn và hiệu quả theo đúng business requirements.

**Scope Coverage:**
- ✅ **Functional Testing:** 100% business flows
- ✅ **Technical Testing:** Database integrity, API validation  
- ✅ **Security Testing:** Authorization, data protection
- ✅ **Performance Testing:** Load handling, response time
- ✅ **Integration Testing:** Cross-module interactions

---

## **📋 TEST CATEGORIES OVERVIEW**

| Category | Test Cases | Priority | Status |
|----------|------------|----------|---------|
| **Core Functional** | TC001-TC020 | High | ⏳ Pending |
| **Advanced Features** | TC021-TC035 | Medium | ⏳ Pending |
| **Technical/Edge Cases** | TC036-TC050 | High | ⏳ Pending |  
| **Security** | TC051-TC060 | Critical | ⏳ Pending |
| **Performance** | TC061-TC070 | Medium | ⏳ Pending |

---

# **🔥 CORE FUNCTIONAL TEST CASES**

## **TC001: Tạo Yêu Cầu COD Thành Công (Happy Path)**
**Priority:** High | **Type:** Functional | **Role:** Dispatcher

**Pre-conditions:**
- User đăng nhập với role Dispatcher
- Có ít nhất 1 container với status = 'AVAILABLE' trong bảng import_containers
- Có ít nhất 2 depot khác nhau trong cùng tỉnh/thành phố

**Test Steps:**
1. Vào trang "Quản lý Lệnh Giao Trả" (/dispatcher)
2. Tìm container với trạng thái "Sẵn sàng" (AVAILABLE)
3. Click vào menu hành động → chọn "Yêu cầu Đổi Nơi Trả"
4. Trong COD Request Dialog:
   - Verify hiển thị đúng thông tin container gốc
   - Chọn "Thành phố Mới" khác với thành phố hiện tại
   - Chọn "Depot Mới Mong Muốn" từ dropdown
   - Nhập "Lý do": "Tiện đường cho chuyến hàng tiếp theo"
   - Click "Gửi Yêu Cầu"

**Expected Results:**
- ✅ Dialog đóng lại thành công
- ✅ Toast message: "Đã gửi yêu cầu thay đổi nơi giao trả thành công!"
- ✅ Trạng thái container chuyển thành "Chờ duyệt đổi nơi trả" (AWAITING_COD_APPROVAL)
- ✅ Badge màu vàng hiển thị cho container
- ✅ Record mới được tạo trong bảng cod_requests với status = 'PENDING'
- ✅ Audit log được ghi với action = 'CREATED'

---

## **TC002: Carrier Admin Phê Duyệt COD Không Phí**
**Priority:** High | **Type:** Functional | **Role:** Carrier Admin

**Pre-conditions:**
- Có ít nhất 1 COD request với status = 'PENDING'
- User đăng nhập với role Carrier Admin của hãng tàu liên quan

**Test Steps:**
1. Vào trang Carrier Admin (/carrier-admin)
2. Chuyển sang tab "Yêu cầu Đổi Nơi Trả (COD)"
3. Verify hiển thị yêu cầu từ TC001
4. Click menu hành động → chọn "Phê duyệt"
5. Trong confirmation dialog, click "Xác nhận"

**Expected Results:**
- ✅ Yêu cầu biến mất khỏi danh sách chờ duyệt
- ✅ Toast message: "Đã phê duyệt yêu cầu thành công."
- ✅ COD request status → 'APPROVED', cod_fee = null
- ✅ Container status → 'AVAILABLE'
- ✅ Container drop_off_location được cập nhật thành depot mới
- ✅ Audit log ghi với action = 'APPROVED'

---

## **TC003: Carrier Admin Phê Duyệt COD Với Phí**
**Priority:** High | **Type:** Functional | **Role:** Carrier Admin

**Pre-conditions:**
- Có ít nhất 1 COD request với status = 'PENDING'

**Test Steps:**
1. Click menu hành động → chọn "Phê duyệt (kèm phí)"
2. Nhập "200000" vào ô "Phí COD"
3. Click "Xác nhận"

**Expected Results:**
- ✅ COD request status → 'APPROVED', cod_fee = 200000
- ✅ Audit log ghi với action = 'APPROVED', details chứa fee: 200000

---

## **TC004: Carrier Admin Từ Chối COD**
**Priority:** High | **Type:** Functional | **Role:** Carrier Admin

**Pre-conditions:**
- Có ít nhất 1 COD request với status = 'PENDING'

**Test Steps:**
1. Click menu hành động → chọn "Từ chối"
2. Nhập lý do: "Depot mới đang quá tải, không thể tiếp nhận thêm container"
3. Click "Xác nhận"

**Expected Results:**
- ✅ COD request status → 'DECLINED'
- ✅ reason_for_decision được lưu đúng
- ✅ Container status rollback về 'AVAILABLE' 
- ✅ Container drop_off_location giữ nguyên (không đổi)
- ✅ Audit log ghi với action = 'DECLINED'

---

## **TC005: Dispatcher Xem Trạng Thái COD Request**
**Priority:** High | **Type:** Functional | **Role:** Dispatcher

**Pre-conditions:**
- Đã có COD requests ở các trạng thái khác nhau (PENDING, APPROVED, DECLINED)

**Test Steps:**
1. Vào trang "Quản lý Yêu cầu" (/dispatcher/requests)
2. Chuyển sang tab "Yêu cầu Đổi Nơi Trả"
3. Verify hiển thị đầy đủ thông tin

**Expected Results:**
- ✅ Hiển thị đúng: Số Container, Nơi trả gốc, Nơi trả mới, Ngày gửi
- ✅ Trạng thái hiển thị với badge màu phù hợp:
  - PENDING → Màu vàng "Đang chờ duyệt"
  - APPROVED → Màu xanh "Đã phê duyệt"  
  - DECLINED → Màu đỏ "Đã từ chối"
- ✅ Hiển thị phí COD nếu có
- ✅ Hiển thị lý do từ chối nếu có

---

## **TC006: Dispatcher Hủy COD Request (Đang PENDING)**
**Priority:** High | **Type:** Functional | **Role:** Dispatcher

**Pre-conditions:**
- Có ít nhất 1 COD request với status = 'PENDING'

**Test Steps:**
1. Trong tab "Yêu cầu Đổi Nơi Trả", tìm request PENDING
2. Click nút "Hủy yêu cầu"
3. Trong confirmation dialog, click "Xác nhận"

**Expected Results:**
- ✅ COD request bị xóa khỏi database
- ✅ Container status rollback về 'AVAILABLE'
- ✅ Toast message: "Đã hủy yêu cầu thành công"
- ✅ Audit log ghi với action = 'CANCELLED'

---

# **🚀 ADVANCED FEATURES TEST CASES**

## **TC021: Yêu Cầu Bổ Sung Thông Tin**
**Priority:** Medium | **Type:** Functional | **Role:** Carrier Admin

**Pre-conditions:**
- Có 1 COD request với status = 'PENDING'

**Test Steps:**
1. Trong bảng COD requests, click "Yêu cầu Bổ sung"
2. Nhập comment: "Vui lòng cung cấp số booking liên quan"
3. Click "Gửi yêu cầu"

**Expected Results:**
- ✅ COD request status → 'AWAITING_INFO'
- ✅ carrier_comment được lưu đúng
- ✅ Audit log với action = 'INFO_REQUESTED'

---

## **TC022: Dispatcher Cung Cấp Thông Tin Bổ Sung**
**Priority:** Medium | **Type:** Functional | **Role:** Dispatcher

**Pre-conditions:**
- Có 1 COD request với status = 'AWAITING_INFO'

**Test Steps:**
1. Trong tab COD requests, thấy badge cam "Cần Bổ sung Thông tin"
2. Click "Cập nhật Yêu cầu"
3. Thấy comment từ Carrier Admin
4. Nhập thông tin bổ sung: "Booking number: MSKU123456789"
5. Click "Gửi cập nhật"

**Expected Results:**
- ✅ COD request status → 'PENDING'
- ✅ reason_for_request được cập nhật với thông tin mới
- ✅ Audit log với action = 'INFO_SUBMITTED'

---

## **TC023: Auto-Expiry COD Requests (24h)**
**Priority:** Medium | **Type:** Technical | **Role:** System

**Pre-conditions:**
- Tạo COD request và manually update created_at về 25 giờ trước
- Cron job đã được setup trong Supabase

**Test Steps:**
1. Chờ cron job chạy (hoặc manually trigger function expire_old_cod_requests())
2. Check database sau khi function chạy

**Expected Results:**
- ✅ COD request status → 'EXPIRED'
- ✅ Container status rollback về 'AVAILABLE'
- ✅ Audit log với action = 'EXPIRED'

---

## **TC024: COD Reversal (Hủy Sau Khi Đã Duyệt)**
**Priority:** Medium | **Type:** Functional | **Role:** Carrier Admin

**Pre-conditions:**
- Có 1 COD request với status = 'APPROVED'

**Test Steps:**
1. Vào chi tiết COD request đã approved
2. Click "Thực hiện Hủy bỏ (Reverse)"
3. Nhập lý do: "Depot mới báo có sự cố, không thể tiếp nhận"
4. Click "Xác nhận"

**Expected Results:**
- ✅ COD request status → 'REVERSED'
- ✅ reason_for_decision được cập nhật
- ✅ Dashboard Dispatcher hiển thị cảnh báo cần xử lý
- ✅ Audit log với action = 'REVERSED'

---

# **⚡ TECHNICAL & EDGE CASES**

## **TC036: Race Condition - Đồng Thời Tạo COD và Street-turn**
**Priority:** High | **Type:** Technical | **Role:** System

**Pre-conditions:**
- Container với status = 'AVAILABLE'
- 2 browser tabs mở cùng lúc

**Test Steps:**
1. Tab 1: Bắt đầu tạo COD request
2. Tab 2: Đồng thời tạo street-turn request cho cùng container
3. Submit cả 2 requests gần như cùng lúc

**Expected Results:**
- ✅ Chỉ 1 trong 2 requests thành công
- ✅ Request thứ 2 nhận error: "Container không ở trạng thái sẵn sàng"
- ✅ Không có data corruption trong database

---

## **TC037: Container Status Validation**
**Priority:** High | **Type:** Technical | **Role:** System

**Test Steps:**
1. Manually update container status thành 'IN_USE'
2. Thử tạo COD request cho container này

**Expected Results:**
- ✅ Server action trả về error
- ✅ Error message: "Thao tác không thể thực hiện. Container này không ở trạng thái sẵn sàng"

---

## **TC038: COD Request Status Validation**
**Priority:** High | **Type:** Technical | **Role:** System

**Test Steps:**
1. Manually update COD request status thành 'APPROVED'
2. Thử approve/decline request này từ UI

**Expected Results:**
- ✅ Server action trả về error
- ✅ Error message: "Thao tác không thể thực hiện. Yêu cầu này đã được xử lý"

---

## **TC039: Database Transaction Rollback**
**Priority:** High | **Type:** Technical | **Role:** System

**Test Steps:**
1. Tạo COD request thành công
2. Manually break database connection trước khi cập nhật container status
3. Verify database consistency

**Expected Results:**
- ✅ Nếu COD request tạo thành công, container status phải được cập nhật
- ✅ Nếu có lỗi, cả COD request và container status đều rollback

---

## **TC040: Invalid Depot Selection**
**Priority:** Medium | **Type:** Functional | **Role:** Dispatcher

**Test Steps:**
1. Chọn thành phố A
2. Manually modify DOM để select depot thuộc thành phố B
3. Submit form

**Expected Results:**
- ✅ Server validation bắt lỗi
- ✅ Error message: "Depot được chọn không thuộc thành phố đã chọn"

---

## **TC041: Audit Log Integrity**
**Priority:** Medium | **Type:** Technical | **Role:** System

**Test Steps:**
1. Thực hiện full flow: Create → Approve → Reverse
2. Check bảng cod_audit_logs

**Expected Results:**
- ✅ 3 records với đúng thứ tự thời gian
- ✅ Mỗi record có đầy đủ: request_id, actor_user_id, action, details
- ✅ Details field chứa thông tin chính xác cho từng action

---

# **🔒 SECURITY TEST CASES**

## **TC051: Authorization - Cross-Organization Access**
**Priority:** Critical | **Type:** Security | **Role:** Attacker

**Test Steps:**
1. Đăng nhập với Company A
2. Lấy request_id của COD request từ Company B
3. Thử gọi API handleCodDecision với request_id này

**Expected Results:**
- ✅ API trả về 403 Forbidden
- ✅ Không có dữ liệu nào bị thay đổi
- ✅ Security log được ghi lại (nếu có)

---

## **TC052: SQL Injection Prevention**
**Priority:** Critical | **Type:** Security | **Role:** Attacker

**Test Steps:**
1. Trong form COD reason, nhập: `'; DROP TABLE cod_requests; --`
2. Submit form

**Expected Results:**
- ✅ Input được escape/sanitize đúng cách
- ✅ Database không bị ảnh hưởng
- ✅ COD request được tạo với reason chứa text gốc

---

## **TC053: XSS Prevention**
**Priority:** High | **Type:** Security | **Role:** Attacker

**Test Steps:**
1. Nhập script tag vào reason field: `<script>alert('XSS')</script>`
2. Submit và xem lại trong danh sách COD requests

**Expected Results:**
- ✅ Script không được execute
- ✅ Text hiển thị as-is hoặc được encode

---

## **TC054: Rate Limiting**
**Priority:** Medium | **Type:** Security | **Role:** Attacker

**Test Steps:**
1. Tạo script tự động gửi 100 COD requests trong 1 phút
2. Monitor response time và server resources

**Expected Results:**
- ✅ Sau X requests, API bắt đầu rate limit
- ✅ Server không bị crash
- ✅ Error 429 Too Many Requests được trả về

---

# **⚡ PERFORMANCE TEST CASES**

## **TC061: Large Dataset Performance**
**Priority:** Medium | **Type:** Performance | **Role:** System

**Pre-conditions:**
- Database có 10,000+ COD requests
- 1,000+ active containers

**Test Steps:**
1. Load trang COD management của Carrier Admin
2. Measure loading time
3. Apply filters và pagination

**Expected Results:**
- ✅ Initial load < 3 seconds
- ✅ Filter operations < 1 second
- ✅ Pagination smooth và responsive

---

## **TC062: Concurrent Users**
**Priority:** Medium | **Type:** Performance | **Role:** Load Test

**Test Steps:**
1. Simulate 50 concurrent Dispatchers tạo COD requests
2. Simulate 10 concurrent Carrier Admins processing requests
3. Monitor database performance

**Expected Results:**
- ✅ All operations complete successfully
- ✅ No deadlocks trong database
- ✅ Response time degradation < 50%

---

## **TC063: Database Query Optimization**
**Priority:** Medium | **Type:** Performance | **Role:** DBA

**Test Steps:**
1. Enable PostgreSQL query logging
2. Perform typical COD operations
3. Analyze slow queries

**Expected Results:**
- ✅ Tất cả queries có execution time < 100ms
- ✅ Proper indexes được sử dụng
- ✅ Không có N+1 query problems

---

# **🔗 INTEGRATION TEST CASES**

## **TC071: Notification System Integration**
**Priority:** Medium | **Type:** Integration | **Role:** System

**Test Steps:**
1. Tạo COD request
2. Approve/decline từ Carrier Admin
3. Check notification delivery

**Expected Results:**
- ✅ Real-time notifications được gửi đến đúng users
- ✅ Email notifications (nếu enabled)
- ✅ In-app notifications hiển thị chính xác

---

## **TC072: Reporting System Integration**
**Priority:** Medium | **Type:** Integration | **Role:** Business

**Test Steps:**
1. Generate COD activity reports
2. Check data accuracy
3. Export functionality

**Expected Results:**
- ✅ Reports reflect accurate COD metrics
- ✅ Export formats (PDF, Excel) work correctly
- ✅ Charts và visualizations display properly

---

# **📊 TEST EXECUTION CHECKLIST**

## **Phase 1: Core Functionality (Must Pass)**
- [ ] TC001-TC006: Basic COD flow
- [ ] TC036-TC041: Critical technical validations  
- [ ] TC051-TC053: Security fundamentals

## **Phase 2: Advanced Features**
- [ ] TC021-TC024: Enhanced UX features
- [ ] TC061-TC063: Performance baselines

## **Phase 3: Full Integration**
- [ ] TC071-TC072: System integrations
- [ ] TC054, TC062: Load testing

---

# **🎯 ACCEPTANCE CRITERIA**

**Module COD được coi là PASS nếu:**

1. **✅ 100% Core Functional test cases PASS** (TC001-TC020)
2. **✅ 100% Critical Security test cases PASS** (TC051-TC053)  
3. **✅ 90%+ Advanced Features test cases PASS** (TC021-TC035)
4. **✅ 80%+ Technical/Edge cases PASS** (TC036-TC050)
5. **✅ Performance benchmarks meet requirements** (TC061-TC063)

**Ready for Production khi:**
- All Phase 1 tests PASS
- Zero critical bugs
- Performance within acceptable limits
- Security review completed

---

**📝 Test Execution Notes:**
- Mỗi test case nên được thực hiện với fresh database để tránh data contamination
- Critical bugs phải được fix trước khi tiếp tục testing
- Performance benchmarks phải được establish trên production-like environment 