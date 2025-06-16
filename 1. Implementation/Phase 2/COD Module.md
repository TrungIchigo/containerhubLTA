# **Business Flow Chi Tiết: Module Change of Destination (COD)**

**ID Chức năng:** FEAT-004

**Tên Chức năng:** Yêu Cầu Thay Đổi Nơi Giao Trả Container Rỗng

**Các vai trò liên quan:** Điều phối viên (Dispatcher), Quản trị viên Hãng tàu (Carrier Admin)

## **Flow 1: Luồng Nghiệp Vụ Của Điều Phối Viên (Dispatcher)**

**Kịch bản chính: Tạo Yêu Cầu COD Thành Công (Happy Path)**

1. **Bối cảnh:** Điều phối viên Anna của "Công ty Vận tải ABC" đang xem trang "Quản lý Lệnh Giao Trả". Cô thấy một lệnh trả container MSKU1234567 về "ICD Sóng Thần" nhưng cô lại có một chuyến hàng mới cần lấy container ở gần "Cảng Cát Lái".
2. **Hành động 1 (Khởi tạo):** Anna tìm đến dòng của container MSKU1234567 (đang có trạng thái "Sẵn sàng" - AVAILABLE), nhấn vào menu hành động và chọn **"Yêu cầu Đổi Nơi Trả"**.
3. **Hành động 2 (Nhập liệu):** Một form (Dialog) hiện ra.
    - Hệ thống tự điền thông tin gốc: Container MSKU1234567, Nơi trả hiện tại: "ICD Sóng Thần".
    - Anna chọn "Thành phố Hồ Chí Minh" trong mục "Thành phố Mới".
    - Danh sách depot được cập nhật, Anna chọn **"Cảng Cát Lái"** trong mục "Depot Mới Mong Muốn".
    - Cô nhập vào ô "Lý do": "Tiện đường cho xe lấy hàng cho chuyến tiếp theo."
    - Anna nhấn nút **"Gửi Yêu Cầu"**.
4. **Phản hồi hệ thống (Ngay lập tức):**
    - Form được đóng lại.
    - Một thông báo nhanh (Toast) xuất hiện: "Đã gửi yêu cầu thay đổi nơi giao trả thành công!".
    - Trên bảng "Quản lý Lệnh Giao Trả", trạng thái của container MSKU1234567 được cập nhật thành **"Chờ duyệt đổi nơi trả"** (AWAITING_COD_APPROVAL) với badge màu vàng. Container này tạm thời bị khóa và không thể dùng để tạo các yêu cầu khác.
5. **Hành động 3 (Theo dõi):** Anna có thể vào trang "Quản lý Yêu cầu" -> tab "Yêu cầu Đổi Nơi Trả" để xem lại yêu cầu vừa gửi với trạng thái "Đang chờ duyệt" (PENDING).
6. **Kết thúc luồng (phía Dispatcher):** Anna chờ phản hồi từ Hãng tàu.

## **Flow 2: Luồng Nghiệp Vụ Của Quản Trị Viên Hãng Tàu (Carrier Admin)**

**Kịch bản 2A: Phê Duyệt Yêu Cầu (Kèm Phí)**

1. **Bối cảnh:** Quản trị viên Brian của "Hãng tàu Maersk" đăng nhập vào portal. Anh thấy một thông báo hoặc một số đếm trên tab **"Yêu Cầu Đổi Nơi Trả (COD)"**.
2. **Hành động 1 (Xem xét):** Brian vào tab COD và thấy yêu cầu từ "Công ty Vận tải ABC" cho container MSKU1234567. Anh thấy rõ họ muốn đổi từ "ICD Sóng Thần" sang "Cảng Cát Lái".
3. **Hành động 2 (Ra quyết định):** Brian kiểm tra hệ thống nội bộ và thấy rằng việc này khả thi nhưng phát sinh chi phí quản lý. Anh nhấn vào menu hành động của yêu cầu và chọn **"Phê duyệt (kèm phí)"**.
4. **Hành động 3 (Nhập liệu):** Một Dialog xác nhận hiện ra, yêu cầu Brian nhập phí. Anh nhập 200000 (VNĐ) vào ô "Phí COD" và nhấn nút **"Xác nhận"**.
5. **Phản hồi hệ thống (Phía Carrier Admin):**
    - Dialog đóng lại.
    - Một thông báo Toast xuất hiện: "Đã phê duyệt yêu cầu thành công."
    - Yêu cầu đó biến mất khỏi danh sách chờ duyệt.
6. **Phản hồi hệ thống (Gửi đến Dispatcher):**
    - Hệ thống gửi một thông báo real-time đến Anna.
    - Trạng thái của yêu cầu COD trong CSDL được cập nhật thành APPROVED, với cod_fee = 200000.
    - **Quan trọng:** Thông tin "Nơi trả hàng" của "Lệnh Giao Trả" gốc được cập nhật thành "Cảng Cát Lái". Trạng thái của lệnh này được cập nhật trở lại thành **"Sẵn sàng"** (AVAILABLE), sẵn sàng cho các hành động tiếp theo (như street-turn tại địa điểm mới).
7. **Trải nghiệm của Anna:** Cô nhận được thông báo "Yêu cầu đổi nơi trả đã được phê duyệt với phí 200.000 VNĐ." và thấy trạng thái container đã được cập nhật trên dashboard.
8. **Kết thúc luồng.**

**Kịch bản 2B: Từ Chối Yêu Cầu**

1. **(Các bước 1 & 2 tương tự trên)**
2. **Hành động 2 (Ra quyết định):** Brian kiểm tra và thấy rằng "Cảng Cát Lái" đang quá tải, không thể tiếp nhận thêm container rỗng. Anh chọn **"Từ chối"**.
3. **Hành động 3 (Nhập liệu):** Một Dialog hiện ra, yêu cầu Brian nhập lý do từ chối. Anh nhập: "Depot Cát Lái hiện đang tạm ngưng tiếp nhận container 40HC. Vui lòng trả về địa điểm cũ." và nhấn **"Xác nhận"**.
4. **Phản hồi hệ thống (Phía Carrier Admin):** Tương tự, yêu cầu biến mất khỏi danh sách chờ.
5. **Phản hồi hệ thống (Gửi đến Dispatcher):**
    - Hệ thống gửi thông báo real-time.
    - Trạng thái của yêu cầu COD được cập nhật thành DECLINED, với reason_for_decision được lưu lại.
    - **Rollback:** Trạng thái của "Lệnh Giao Trả" gốc được cập nhật trở lại thành **"Sẵn sàng"** (AVAILABLE) với nơi trả vẫn là "ICD Sóng Thần".
6. **Trải nghiệm của Anna:** Cô nhận được thông báo từ chối kèm lý do và thấy container của mình đã "mở khóa", sẵn sàng để cô tìm phương án tối ưu khác.
7. **Kết thúc luồng.**

## **Flow 3: Các Luồng Ngoại Lệ & Kịch Bản Biên (Exceptional Flows)**

1. **Kịch bản: Dispatcher muốn hủy yêu cầu COD đã gửi.**
    - **Vấn đề:** Anna gửi yêu cầu nhưng sau 5 phút lại tìm được một cơ hội street-turn tốt hơn từ địa điểm cũ. Cô muốn hủy yêu cầu COD đang chờ.
    - **Giải pháp:**
        - Trên trang "Quản lý Yêu cầu" -> tab "Yêu cầu Đổi Nơi Trả", với các yêu cầu đang PENDING, cần có một nút **"Hủy yêu cầu"**.
        - Khi nhấn, một Server Action sẽ được gọi để xóa record yêu cầu COD và rollback trạng thái của Lệnh Giao Trả về AVAILABLE.
        - **Ràng buộc:** Nút "Hủy yêu cầu" này phải bị vô hiệu hóa ngay khi Hãng tàu đã xử lý yêu cầu (tức là trạng thái không còn là PENDING).
2. **Kịch bản: Lệnh Giao Trả được dùng cho Street-turn trong khi đang chờ duyệt COD.**
    - **Vấn đề:** Nếu chúng ta không khóa Lệnh Giao Trả lại, Anna có thể vô tình tạo 2 yêu cầu (1 COD, 1 Street-turn) cho cùng 1 container.
    - **Giải pháp:**
        - Như đã đề cập, khi một yêu cầu COD được tạo, trạng thái của import_containers phải được đổi thành AWAITING_COD_APPROVAL.
        - Logic ghép lệnh street-turn phải được cập nhật để **bỏ qua** tất cả các container không có trạng thái AVAILABLE. Điều này đảm bảo tính toàn vẹn của dữ liệu.
3. **Kịch bản: Hãng tàu duyệt một yêu cầu đã bị Dispatcher hủy.**
    - **Vấn đề:** Anna vừa hủy yêu cầu thì Brian lại nhấn nút duyệt.
    - **Giải pháp:**
        - Server Action handleCodDecision của Hãng tàu phải luôn kiểm tra trạng thái hiện tại của yêu cầu trước khi cập nhật. Nếu trạng thái không còn là PENDING, nó phải trả về một thông báo lỗi: "Yêu cầu này đã được xử lý hoặc đã bị hủy bởi người dùng."

---

# **Phân Tích & Giải Pháp Chi Tiết Cho Các Kịch Bản Nâng Cao**

## **1. Case: Yêu Cầu Cần Bổ Sung Thông Tin (Requires More Info)**

**Phân tích:** Đây là một luồng tương tác hai chiều rất phổ biến. Việc từ chối ngay lập tức là một trải nghiệm không tốt. Cho phép bổ sung thông tin sẽ tăng tỷ lệ yêu cầu được phê duyệt.

**Giải pháp:**

- **Cập nhật CSDL:**
    - Thêm một trạng thái mới vào ENUM cod_request_status: **AWAITING_INFO**.
    - Bảng cod_requests cần thêm một cột carrier_comment (TEXT) để Hãng tàu ghi chú thông tin họ cần.
- **Business Flow Mới:**
    1. **[Carrier Admin]** Brian thấy một yêu cầu nhưng thông tin chưa đủ. Anh nhấn vào một nút mới: **"Yêu cầu Bổ sung"**.
    2. Một Dialog hiện ra, Brian nhập vào ô carrier_comment: "Vui lòng cung cấp số booking liên quan cho chuyến hàng tiếp theo."
    3. Hệ thống UPDATE trạng thái yêu cầu thành AWAITING_INFO và lưu lại comment.
    4. **[Dispatcher]** Anna nhận được thông báo real-time. Yêu cầu của cô trên trang "Quản lý Yêu cầu" chuyển sang màu cam với trạng thái **"Cần Bổ sung Thông tin"**.
    5. Anna nhấn vào một nút **"Cập nhật Yêu cầu"** mới. Một Dialog hiện ra, hiển thị comment của Brian và cho phép Anna nhập thêm thông tin vào reason_for_request hoặc một trường mới additional_info.
    6. Sau khi Anna gửi cập nhật, trạng thái của yêu cầu được tự động chuyển về lại **PENDING**, và nó xuất hiện trở lại trong danh sách chờ của Brian với thông tin đã được cập nhật.

## **2. Case: COD Tự Động Phê Duyệt (Auto-Approve Logic)**

**Phân tích:** Tương tự như Auto-Approval cho Street-turn, tính năng này sẽ là một "vũ khí" cực mạnh để tăng tốc độ và hiệu quả, củng cố USP của sản phẩm.

**Giải pháp:**

- **Tận dụng nền tảng đã có:** Chúng ta có thể mở rộng hệ thống "Auto-Approval Rules" hiện tại.
- **Cập nhật CSDL:**
    - Bảng auto_approval_rules cần thêm một cột rule_type (ENUM: 'STREET_TURN', 'COD').
    - Bảng rule_conditions cần hỗ trợ các loại điều kiện mới cho COD, ví dụ: ORIGINAL_DEPOT_ID, REQUESTED_DEPOT_ID, MAX_DISTANCE_BETWEEN_DEPOTS.
- **Business Flow:**
    1. **[Carrier Admin]** Brian vào trang "Quy tắc Tự động", chọn tạo một quy tắc loại "COD".
    2. Anh thiết lập điều kiện: "NẾU Công ty Vận tải nằm trong 'Whitelist ABC', VÀ Nơi trả gốc là 'ICD Sóng Thần', VÀ Nơi trả mới là 'Cảng Cát Lái' -> THÌ Tự động Phê duyệt."
    3. **[Hệ thống]** Khi một yêu cầu COD mới được tạo và khớp với quy tắc này, hệ thống sẽ tự động duyệt ngay lập tức và thông báo cho cả hai bên.

## **3. Case: Yêu Cầu Hết Hạn (Request Expiration)**

**Phân tích:** Ngăn chặn tình trạng yêu cầu bị "treo" vô thời hạn, đảm bảo container được giải phóng để thực hiện các công việc khác.

**Giải pháp:**

- **Cập nhật CSDL:** Thêm một trạng thái mới vào ENUM cod_request_status: **EXPIRED**.
- **Triển khai Tác vụ Nền (Cron Job):**
    - Sử dụng Vercel Cron Jobs hoặc Supabase PG-Cron để chạy một tác vụ mỗi giờ.
    - **Logic của tác vụ:**
        - `- Tìm các yêu cầu PENDING đã quá 24 giờ
        UPDATE public.cod_requests
        SET status = 'EXPIRED'
        WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '24 hours';
        -- Sau đó, cần một bước nữa để rollback trạng thái container của các yêu cầu vừa hết hạn.`
        
    - Khi một yêu cầu bị chuyển sang EXPIRED, hệ thống cần gửi thông báo cho Dispatcher.

## **4. Case: Cross-Check Trạng Thái Thực Tế Của Container**

**Phân tích:** Đây là một yêu cầu cực kỳ quan trọng để đảm bảo tính toàn vẹn dữ liệu và tránh các lỗi nghiệp vụ nghiêm trọng.

**Giải pháp:**

- **Bảo vệ ở tầng Backend (Server Actions):**
    1. **Trước khi tạo yêu cầu COD:** Trong Server Action createCodRequest, bước đầu tiên phải là SELECT status FROM import_containers WHERE id = [dropoff_order_id]. Nếu status không phải là AVAILABLE, trả về lỗi ngay lập tức.
    2. **Trước khi Carrier Admin duyệt:** Trong Server Action handleCodDecision, bước đầu tiên cũng phải là SELECT status FROM import_containers.... Nếu container đã được xử lý bởi một giao dịch khác (ví dụ: một yêu cầu hủy đã rollback trạng thái của nó), hãy trả về lỗi cho Brian: "Thao tác không thể thực hiện. Trạng thái của container đã thay đổi."

## **5. Audit Log & Tracking**

**Phân tích:** Cần thiết cho việc giải quyết tranh chấp, kiểm toán và phân tích quy trình.

**Giải pháp:**

- **Tạo bảng mới cod_audit_logs:**
    - **Cấu trúc:** id, request_id, user_id (người thực hiện), org_id, action (ENUM: 'CREATED', 'APPROVED', 'DECLINED', 'INFO_REQUESTED', 'INFO_SUBMITTED', 'EXPIRED'), details (JSONB để lưu các thông tin như phí, lý do, trạng thái cũ/mới), created_at.
- **Tích hợp vào Server Actions:**
    - Trong **MỌI** Server Action liên quan đến COD (createCodRequest, handleCodDecision, cancelCodRequest...), sau khi thực hiện hành động chính, hãy INSERT một record tương ứng vào bảng cod_audit_logs.
- **Giao diện:** Tạo một tab "Lịch sử Thay đổi" trong trang chi tiết của mỗi yêu cầu COD để hiển thị các log này cho người dùng.

## **6. Case: Hủy COD Sau Khi Đã Phê Duyệt (COD Reversal)**

**Phân tích:** Kịch bản hiếm nhưng có thật, cần một quy trình xử lý rõ ràng.

**Giải pháp:**

- **Cập nhật CSDL:** Thêm trạng thái REVERSED vào ENUM cod_request_status.
- **Business Flow:**
    1. **[Carrier Admin]** Brian nhận được thông tin depot mới không thể tiếp nhận. Anh vào trang chi tiết của yêu cầu COD đã duyệt.
    2. Một nút **"Thực hiện Hủy bỏ (Reverse)"** chỉ hiển thị cho các yêu cầu đã APPROVED.
    3. Nhấn vào nút sẽ mở một Dialog yêu cầu nhập lý do.
    4. Server Action reverseCodRequest sẽ được gọi, thực hiện:
        - UPDATE trạng thái yêu cầu thành REVERSED.
        - Gửi thông báo khẩn cho Dispatcher.
        - **Quan trọng:** Hệ thống **không** tự động rollback nơi trả hàng. Nó sẽ tạo ra một "cảnh báo" trên Dashboard của Dispatcher, yêu cầu họ phải vào xử lý: "Lệnh giao trả [XYZ] cần được cập nhật lại nơi trả hàng do có sự cố tại depot."

## **7. Case: Đồng Bộ Với Hệ Thống Hãng Tàu (API Sync)**

**Phân tích:** Đây là một tính năng cho tương lai xa, khi chúng ta tích hợp trực tiếp với API của các hãng tàu lớn.

**Giải pháp:**

- **Cập nhật CSDL:** Thêm cột sync_status (ENUM: 'NOT_SYNCED', 'SYNCED', 'FAILED_SYNC') và sync_error_message (TEXT) vào bảng cod_requests.
- **Business Flow:**
    - Sau khi Brian duyệt một yêu cầu trên i-ContainerHub, một tác vụ nền sẽ được kích hoạt để gọi đến API của Maersk/ONE...
    - Tác vụ này sẽ cập nhật sync_status dựa trên kết quả trả về từ API của hãng tàu.
    - Nếu FAILED_SYNC, hệ thống sẽ tạo một cảnh báo cho Brian để anh xử lý thủ công.

---

# **Mô Tả Chi Tiết Triển Khai: Module COD (Change of Destination)**

**Mục tiêu tổng thể:** Xây dựng một luồng chức năng hoàn chỉnh cho phép Công ty Vận tải gửi yêu cầu thay đổi nơi trả container rỗng, và Hãng tàu có thể xem xét, phê duyệt (kèm hoặc không kèm phí) hoặc từ chối yêu cầu đó.

## **Hạng Mục 1: Nền Tảng Backend & Cơ Sở Dữ Liệu**

### **Task 1.1: Cập Nhật Cơ Sở Dữ Liệu**

- **Mục tiêu:** Tạo bảng mới để lưu trữ các yêu cầu COD.
- **Yêu cầu (Code SQL):**
    - `- Tạo một ENUM mới cho trạng thái của yêu cầu COD
    CREATE TYPE public.cod_request_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED');
    -- Tạo bảng chính để lưu các yêu cầu
    CREATE TABLE public.cod_requests ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), dropoff_order_id UUID NOT NULL REFERENCES public.import_containers(id) ON DELETE CASCADE, -- Liên kết đến Lệnh Giao Trả gốc requesting_org_id UUID NOT NULL REFERENCES public.organizations(id), approving_org_id UUID NOT NULL REFERENCES public.organizations(id), -- Hãng tàu original_depot_address TEXT, -- Lưu lại địa chỉ depot gốc để hiển thị requested_depot_id UUID NOT NULL REFERENCES public.depots(id), -- Depot mới mong muốn status public.cod_request_status NOT NULL DEFAULT 'PENDING', cod_fee NUMERIC, -- Phí COD do hãng tàu nhập reason_for_request TEXT, -- Lý do từ phía công ty vận tải reason_for_decision TEXT, -- Lý do từ chối từ phía hãng tàu created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ
    );
    COMMENT ON TABLE public.cod_requests IS 'Lưu trữ các yêu cầu thay đổi nơi trả container rỗng (Change of Destination).';
    -- Bật RLS và thêm chính sách
    ALTER TABLE public.cod_requests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Involved parties can access COD requests" ON public.cod_requests
    FOR ALL USING ( (requesting_org_id = public.get_current_org_id()) OR (approving_org_id = public.get_current_org_id())
    );`
    

### **Task 1.2: Tạo Các Server Actions Cần Thiết**

- **File:** src/app/actions.ts (hoặc cod.actions.ts).
- **Yêu cầu:** Tạo 2 Server Action chính.
1. **createCodRequest(formData):**
    - **Tham số:** Nhận formData từ form của Dispatcher.
    - **Logic:**
        
        a. Trích xuất các dữ liệu: dropoff_order_id, requested_depot_id, reason_for_request.
        
        b. Lấy thông tin người dùng hiện tại (requesting_org_id).
        
        c. Lấy thông tin approving_org_id (hãng tàu) và original_depot_address từ dropoff_order gốc.
        
        d. INSERT một record mới vào bảng cod_requests với status = 'PENDING'.
        
        e. UPDATE trạng thái của import_containers (Lệnh Giao Trả) liên quan thành một trạng thái mới như AWAITING_COD_APPROVAL để khóa nó lại, tránh tạo các yêu cầu khác. (Cần thêm trạng thái này vào ENUM asset_status).
        
        f. Gọi revalidatePath cho các trang liên quan (/dispatcher, /requests, /carrier-admin).
        
        g. Trả về kết quả thành công/thất bại.
        
2. **handleCodDecision(formData):**
    - **Tham số:** Nhận formData từ form của Carrier Admin. Sẽ chứa requestId, decision ('APPROVED', 'APPROVED_WITH_FEE', 'DECLINED'), cod_fee (nếu có), reason_for_decision (nếu có).
    - **Logic:**
        
        a. Lấy thông tin yêu cầu COD từ CSDL dựa vào requestId.
        
        b. **Nếu decision === 'DECLINED':**
        
        - UPDATE cod_requests: status = 'DECLINED', reason_for_decision = ....
        - **Rollback:** UPDATE import_containers: status = 'AVAILABLE'.
        
        c. **Nếu decision === 'APPROVED' hoặc 'APPROVED_WITH_FEE':**
        
        - UPDATE cod_requests: status = 'APPROVED', cod_fee = ....
        - **Hành động chính:** UPDATE bảng import_containers: cập nhật lại trường drop_off_location (và depot_id nếu có) thành thông tin của depot mới. Đồng thời đổi status thành AVAILABLE (hoặc một trạng thái COD_APPROVED mới) để nó có thể tiếp tục được dùng cho street-turn.
        
        d. Gọi revalidatePath cho các trang liên quan.
        
        e. Trả về kết quả.
        

---

## **Hạng Mục 2: Giao Diện & Luồng Phía Công Ty Vận Tải (Dispatcher)**

### **Task 2.1: Bổ Sung Hành Động Mới**

- **File:** src/components/features/dispatcher/DropOffOrdersTable.tsx (Bảng quản lý Lệnh Giao Trả).
- **Yêu cầu:**
    - Trong cột "Hành động" của mỗi hàng, với các lệnh có status = 'AVAILABLE', thêm một mục trong <DropdownMenu> hoặc một nút mới: **"Yêu cầu Đổi Nơi Trả"**.

### **Task 2.2: Xây Dựng Form Yêu Cầu COD**

- **File cần tạo:** src/components/features/cod/CodRequestDialog.tsx.
- **Yêu cầu:**
    1. Sử dụng <Dialog> của Shadcn/ui, được kích hoạt bởi nút ở Task 2.1.
    2. Component này nhận prop là dropoffOrder (chi tiết của Lệnh Giao Trả).
    3. **Bên trong <DialogContent>:**
        - **Tiêu đề:** "Tạo Yêu Cầu Thay Đổi Nơi Giao Trả".
        - **Thông tin gốc (Read-only):** Hiển thị Số container, Nơi trả hiện tại.
        - **Form (dùng react-hook-form):**
            - **Thành phố Mới (*):** <Select> để chọn thành phố.
            - **Depot Mới Mong Muốn (*):** <Select> phụ thuộc, load danh sách depot theo thành phố đã chọn.
            - **Lý do (tùy chọn):** <Textarea> cho reason_for_request.
        - **Nút "Gửi Yêu Cầu"** sẽ gọi Server Action createCodRequest.

### **Task 2.3: Trang Quản Lý Yêu Cầu COD**

- **File:** Trang "Quản lý Yêu cầu" (/requests).
- **Yêu cầu:**
    - Thêm một <Tab> mới tên là **"Yêu cầu Đổi Nơi Trả"**.
    - Tab này sẽ fetch và hiển thị danh sách các yêu cầu từ bảng cod_requests của công ty hiện tại.
    - Hiển thị các cột: Số Container, Nơi trả gốc, Nơi trả mới, Ngày gửi, Trạng thái (dùng <Badge>), Phí COD (nếu có), Lý do từ chối (nếu có).

---

## **Hạng Mục 3: Giao Diện & Luồng Phía Hãng Tàu (Carrier Admin)**

### **Task 3.1: Thêm Khu Vực Quản Lý COD**

- **File:** src/app/(main)/carrier-admin/page.tsx.
- **Yêu cầu:**
    - Sử dụng <Tabs> để phân chia giao diện.
    - Tab 1: "Yêu cầu Tái Sử Dụng" (luồng street-turn hiện tại).
    - Tab 2: **"Yêu cầu Đổi Nơi Trả (COD)"**.

### **Task 3.2: Xây Dựng Bảng & Dialog Xử Lý Yêu Cầu COD**

- **File cần tạo:** src/components/features/cod/CodRequestsQueue.tsx.
- **Yêu cầu:**
    1. Component này sẽ được đặt trong Tab 2 ở trên.
    2. Nó sẽ fetch và hiển thị các yêu cầu COD có approving_org_id là của hãng tàu và status = 'PENDING'.
    3. **Bảng hiển thị:**
        - Các cột: Công ty Yêu cầu, Số Container, Nơi trả gốc, Nơi trả mới đề xuất, Ngày gửi.
        - Cột cuối cùng "Hành động" sẽ chứa một <DropdownMenu> với các lựa chọn: **"Phê duyệt"**, **"Phê duyệt (kèm phí)"**, **"Từ chối"**.
    4. **Tạo các Dialog xử lý:**
        - Mỗi lựa chọn trong Dropdown sẽ mở một <AlertDialog> tương ứng.
        - **Dialog "Từ chối":** Yêu cầu nhập reason_for_decision.
        - **Dialog "Phê duyệt (kèm phí)":** Có một ô <Input type="number"> để nhập cod_fee.
        - Mỗi dialog sẽ có nút "Xác nhận" để gọi Server Action handleCodDecision với các tham số phù hợp.

---

# **Mô Tả Chi Tiết Coding: Các Kịch Bản Nâng Cao Cho Module COD**

**Ưu tiên 1: Nền tảng & An toàn**

## **Hạng Mục 1: Cross-Check Trạng Thái Thực Tế Của Container (Đảm Bảo An Toàn)**

- **Mục tiêu:** Ngăn chặn các hành động trên một container đã có trạng thái không phù hợp, tránh các lỗi nghiệp vụ nghiêm trọng (race conditions).
- **Yêu cầu:** Sửa đổi các Server Actions liên quan.
1. **Server Action: createCodRequest**
    - **File:** src/app/actions.ts (hoặc cod.actions.ts).
    - **Logic:** **Ở ngay đầu của action**, trước khi thực hiện bất kỳ hành động INSERT nào.
        
        `// ...
        const { data: container, error: fetchError } = await supabase
            .from('import_containers')
            .select('status')
            .eq('id', dropoff_order_id)
            .single();
        
        if (fetchError || !container) {
            return { success: false, message: 'Không tìm thấy container liên quan.' };
        }
        
        if (container.status !== 'AVAILABLE') {
            return { success: false, message: 'Thao tác không thể thực hiện. Container này không ở trạng thái sẵn sàng.' };
        }
        
        // ... Tiếp tục logic INSERT nếu container hợp lệ ...`
        
2. **Server Action: handleCodDecision**
    - **File:** src/app/actions.ts (hoặc cod.actions.ts).
    - **Logic:** Tương tự, ở ngay đầu của action.
        
        `// ...
        const { data: codRequest, error: fetchCodError } = await supabase
            .from('cod_requests')
            .select('status, dropoff_order_id')
            .eq('id', requestId)
            .single();
        
        if (fetchCodError || !codRequest) {
            return { success: false, message: 'Không tìm thấy yêu cầu COD.' };
        }
        
        // KIỂM TRA QUAN TRỌNG: Yêu cầu này đã được xử lý chưa?
        if (codRequest.status !== 'PENDING' && codRequest.status !== 'AWAITING_INFO') {
            return { success: false, message: 'Thao tác không thể thực hiện. Yêu cầu này đã được xử lý hoặc bị hủy.' };
        }
        
        // ... Tiếp tục logic phê duyệt/từ chối ...`
        

## **Hạng Mục 2: Audit Log & Tracking**

- **Mục tiêu:** Ghi lại mọi hành động liên quan đến một yêu cầu COD để phục vụ kiểm toán và giải quyết tranh chấp.
1. **Cập Nhật CSDL:**
    - **Yêu cầu:** Chạy mã SQL sau để tạo bảng logs.
        
        `CREATE TYPE public.audit_log_action AS ENUM ('CREATED', 'APPROVED', 'DECLINED', 'INFO_REQUESTED', 'INFO_SUBMITTED', 'EXPIRED', 'REVERSED', 'CANCELLED');
        
        CREATE TABLE public.cod_audit_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            request_id UUID NOT NULL REFERENCES public.cod_requests(id) ON DELETE CASCADE,
            actor_user_id UUID REFERENCES auth.users(id),
            actor_org_name TEXT,
            action public.audit_log_action NOT NULL,
            details JSONB, -- Lưu các thông tin phụ, vd: { fee: 200000, reason: '...' }
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        COMMENT ON TABLE public.cod_audit_logs IS 'Lịch sử các hành động trên một yêu cầu COD.';`
        
        **content_copydownload**Use code [**with caution**](https://support.google.com/legal/answer/13505487).SQL
        
2. **Tích hợp vào Server Actions:**
    - **Yêu cầu:** Trong **MỌI** Server Action của module COD, sau khi hành động chính thành công, hãy thêm một bước INSERT vào cod_audit_logs.
    - **Ví dụ trong handleCodDecision sau khi duyệt thành công:**
        
        `// ... sau khi UPDATE thành công ...
        await supabase.from('cod_audit_logs').insert({
            request_id: requestId,
            actor_user_id: user.id, // Lấy từ supabase.auth.getUser()
            actor_org_name: 'Tên Công ty Hãng tàu', // Lấy từ profile
            action: 'APPROVED',
            details: { fee: cod_fee } // Lưu lại phí nếu có
        });`
        

---

**Ưu tiên 2: Trải nghiệm Người dùng**

## **Hạng Mục 3: Yêu Cầu Cần Bổ Sung Thông Tin**

1. **Cập Nhật CSDL:**
    - **Yêu cầu:** Thêm trạng thái mới và cột comment.
        
        `ALTER TYPE public.cod_request_status ADD VALUE 'AWAITING_INFO';
        ALTER TABLE public.cod_requests ADD COLUMN carrier_comment TEXT;
        ```2.  **Tạo Server Actions mới:**`
        
    - requestMoreInfo(requestId, comment): UPDATE status thành AWAITING_INFO, lưu carrier_comment. Nhớ ghi Audit Log.
    - submitAdditionalInfo(requestId, additionalInfo): UPDATE reason_for_request (hoặc một trường mới), đổi status về lại PENDING. Nhớ ghi Audit Log.
2. **Cập Nhật Frontend (Carrier Admin):**
    - Thêm nút "Yêu cầu Bổ sung" vào menu hành động.
    - Nút này mở một Dialog (RequestInfoDialog.tsx) có <Textarea> để nhập comment và gọi action requestMoreInfo.
3. **Cập Nhật Frontend (Dispatcher):**
    - Trong bảng quản lý yêu cầu COD, hiển thị badge màu cam "Cần Bổ sung" cho trạng thái AWAITING_INFO.
    - Thêm nút "Cập nhật Yêu cầu" chỉ hiển thị khi có trạng thái này.
    - Nút này mở Dialog (SubmitInfoDialog.tsx) hiển thị comment của hãng tàu và cho phép người dùng nhập thông tin bổ sung, sau đó gọi action submitAdditionalInfo.

---

**Ưu tiên 3: Tự động hóa**

## **Hạng Mục 4: Yêu Cầu Hết Hạn**

1. **Cập Nhật CSDL:**
    - ALTER TYPE public.cod_request_status ADD VALUE 'EXPIRED';
2. **Tạo PostgreSQL Function để xử lý:**
    - **Mục tiêu:** Tạo một hàm có thể được gọi bởi Cron Job để xử lý logic một cách an toàn.
        
        `CREATE OR REPLACE FUNCTION expire_old_cod_requests()
        RETURNS VOID AS $$
        DECLARE
            expired_request RECORD;
        BEGIN
            FOR expired_request IN
                SELECT id, dropoff_order_id FROM public.cod_requests
                WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '24 hours'
            LOOP
                -- Cập nhật yêu cầu COD
                UPDATE public.cod_requests SET status = 'EXPIRED' WHERE id = expired_request.id;
                -- Rollback trạng thái container
                UPDATE public.import_containers SET status = 'AVAILABLE' WHERE id = expired_request.dropoff_order_id;
                -- Ghi log
                INSERT INTO public.cod_audit_logs (request_id, action, details)
                VALUES (expired_request.id, 'EXPIRED', '{"reason": "Auto-expired after 24 hours"}');
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;`
        
3. **Thiết Lập Supabase PG-Cron:**
    - Vào Dashboard Supabase -> Database -> Cron Jobs.
    - Tạo một Job mới:
        - **Name:** expire-cod-requests
        - **Schedule:** 0 * * * * (Chạy vào đầu mỗi giờ).
        - **Function to call:** SELECT * FROM expire_old_cod_requests();