**Module Thanh Toán & Hóa Đơn (Billing & Invoicing)**. Đây là module biến các hoạt động tối ưu hóa thành dòng tiền thực tế, trực tiếp chứng minh giá trị thương mại của i-ContainerHub@LTA.

### **Phần 1: Phân Tích & Mô Tả Luồng Nghiệp Vụ Hoàn Chỉnh**

**Mục tiêu:** Xây dựng một quy trình tự động để ghi nhận các khoản phí, tổng hợp công nợ, xuất hóa đơn và theo dõi tình trạng thanh toán cho các dịch vụ phát sinh trên nền tảng.

**Các bên liên quan chính:**

- **Công ty Vận tải (Dispatcher):** Bên sử dụng dịch vụ và có trách nhiệm thanh toán phí.
- **i-ContainerHub@LTA (Platform Admin):** Bên cung cấp dịch vụ và thu phí.
- **Hãng tàu (Carrier Admin):** Bên tạo ra các khoản phí (ví dụ: phí COD) nhưng không trực tiếp tham gia vào luồng thanh toán với i-ContainerHub.

### **A. Luồng Ghi Nhận Công Nợ (Transaction & Debt Recognition)**

Đây là bước xác định "khi nào một khoản phí được tạo ra".

**Mục tiêu:** Ghi nhận chính xác, riêng biệt hai loại phí:

1. **Phí COD:** Do Hãng tàu đặt ra, trả cho Hãng tàu (hệ thống chỉ ghi nhận để minh bạch).
2. **Phí Giao Dịch:** Do i-ContainerHub đặt ra, trả cho i-ContainerHub.

### **Luồng 1: Yêu cầu COD được phê duyệt có phí**

- **Step trong quy trình hiện tại:** Ngay sau khi Hãng tàu Brian nhấn "Xác nhận" trong dialog "Phê duyệt (kèm phí)".
- **Logic (Đã điều chỉnh):**
    - Dialog "Phê duyệt (kèm phí)" **phải có một ô input** để Brian **nhập vào số tiền phí COD tự do** (ví dụ: 150.000, 250.000, hoặc một con số bất kỳ).
    - Server Action handleCodDecision sẽ nhận số tiền này từ form.
    - Logic UPDATE bảng cod_requests sẽ lưu lại chính xác số tiền này vào cột cod_fee.
    - **Quan trọng:** Khoản phí này là một giao dịch tài chính **giữa Công ty Vận tải và Hãng tàu**. Hệ thống i-ContainerHub của chúng ta chỉ **ghi nhận và hiển thị** nó để đảm bảo sự minh bạch cho cả hai bên. Nó **KHÔNG** được ghi vào bảng transactions của i-ContainerHub vì đây không phải là doanh thu của chúng ta.

### **Luồng 2: Phí Dịch Vụ Của i-ContainerHub**

Đây mới là các giao dịch tạo ra doanh thu cho nền tảng.

**Trigger A: Giao dịch Street-turn trên Marketplace thành công**

- **Step trong quy trình hiện tại:** Ngay sau khi Hãng tàu phê duyệt một yêu cầu street-turn có match_type = 'MARKETPLACE'.
- **Logic (Đã điều chỉnh):**
    - Server Action xử lý phê duyệt sẽ INSERT một record mới vào bảng transactions.
    - **Thông tin record:**
        - transaction_type = 'MARKETPLACE_FEE'
        - amount = 20000 (Theo mức phí bạn đề xuất, chúng ta sẽ đặt con số này trong một biến môi trường hoặc file config để dễ thay đổi).
        - payer_org_id = [ID của Công ty Vận tải đã "mua" cơ hội].
        - status = 'UNPAID'.
        - description = "Phí giao dịch thành công trên Thị trường cho yêu cầu [ID yêu cầu]"

**Trigger B (Mới): Giao dịch COD thành công**

- **Step trong quy trình hiện tại:** Ngay sau khi Hãng tàu phê duyệt một yêu cầu COD (dù có phí hay không).
- **Logic (Mới):**
    - Bản thân việc thực hiện thành công một yêu cầu COD trên nền tảng của chúng ta cũng là một dịch vụ có giá trị. Chúng ta cũng sẽ thu một khoản phí nhỏ cho việc này.
    - Trong Server Action handleCodDecision, **sau khi** đã UPDATE thành công trạng thái yêu cầu COD thành APPROVED:
    - Hệ thống sẽ INSERT một record thứ hai vào bảng transactions.
    - **Thông tin record:**
        - transaction_type = 'COD_SERVICE_FEE' (Cần thêm loại này vào ENUM).
        - amount = 20000 (Sử dụng cùng mức phí mặc định).
        - payer_org_id = [ID của Công ty Vận tải đã gửi yêu cầu COD].
        - status = 'UNPAID'.
        - description = "Phí dịch vụ xử lý yêu cầu COD [ID yêu cầu]"

### **B. Luồng Tổng Hợp & Xuất Hóa Đơn (Invoicing)**

Đây là bước biến các công nợ lẻ thành một chứng từ thanh toán chính thức.

1. **Trigger:** Có thể là tự động theo chu kỳ (ví dụ: vào ngày cuối cùng của tháng) hoặc do Admin hệ thống khởi tạo thủ công.
2. **Logic (thực hiện bởi một tác vụ nền hoặc Admin):**
    - Hệ thống quét tất cả các record trong bảng transactions có status = 'UNPAID' và thuộc về cùng một payer_org_id trong một chu kỳ nhất định (ví dụ: tháng 6/2025).
    - Hệ thống INSERT một record mới vào bảng invoices.
    - **Thông tin record:** invoice_id, organization_id, period_start, period_end, total_amount, due_date (ngày hết hạn thanh toán), status = 'PENDING'.
    - Sau khi tạo hóa đơn, hệ thống UPDATE trạng thái của tất cả các giao dịch liên quan từ UNPAID thành INVOICED và gán invoice_id cho chúng.
3. **Hành động tiếp theo:** Hệ thống tự động gửi một email thông báo đến email quản lý của Công ty Vận tải: "Hóa đơn tháng 6/2025 của bạn đã được phát hành. Vui lòng thanh toán trước ngày...". Email này có đính kèm file PDF của hóa đơn.

### **C. Luồng Thanh Toán & Đối Soát (Payment & Reconciliation)**

Đây là bước cuối cùng để hoàn tất vòng lặp.

1. **Hành động của Công ty Vận tải:**
    - Họ nhận được hóa đơn, có thể vào một trang "Thanh toán & Hóa đơn" trên i-ContainerHub để xem chi tiết.
    - Họ thực hiện thanh toán (ban đầu có thể là chuyển khoản ngân hàng, tương lai có thể tích hợp cổng thanh toán).
2. **Hành động của Admin hệ thống:**
    - Sau khi nhận được thanh toán qua ngân hàng, bạn (Admin) vào Admin Dashboard, tìm đến hóa đơn tương ứng.
    - Bạn nhấn nút **"Xác nhận đã thanh toán"**.
3. **Logic hệ thống:**
    - UPDATE trạng thái của invoices thành PAID.
    - UPDATE trạng thái của tất cả các transactions liên quan thành PAID.
4. **Kết thúc luồng.**

---

### **Phần 2: Mô Tả Chi Tiết Để AI Code**

### **Task 1: Cập Nhật & Tạo Mới CSDL**

- **Mục tiêu:** Xây dựng cấu trúc CSDL để hỗ trợ toàn bộ module thanh toán.
- **Yêu cầu (Code SQL):**Generated sql
    
    `- Trạng thái cho giao dịch và hóa đơn
    CREATE TYPE public.transaction_status AS ENUM ('UNPAID', 'INVOICED', 'PAID', 'CANCELLED');
    CREATE TYPE public.invoice_status AS ENUM ('DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
    CREATE TYPE public.transaction_type AS ENUM ('COD_FEE', 'MARKETPLACE_FEE');
    -- Bảng lưu từng giao dịch phát sinh phí
    CREATE TABLE public.transactions ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), payer_org_id UUID NOT NULL REFERENCES public.organizations(id), related_request_id UUID, -- ID của yêu cầu street-turn hoặc COD liên quan transaction_type public.transaction_type NOT NULL, amount NUMERIC NOT NULL, description TEXT, status public.transaction_status NOT NULL DEFAULT 'UNPAID', invoice_id UUID, -- Sẽ được cập nhật khi hóa đơn được tạo created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- Bảng lưu hóa đơn tổng hợp
    CREATE TABLE public.invoices ( id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), organization_id UUID NOT NULL REFERENCES public.organizations(id), invoice_number TEXT NOT NULL UNIQUE, -- Ví dụ: INV-2025-06-001 period_start DATE NOT NULL, period_end DATE NOT NULL, total_amount NUMERIC NOT NULL, issue_date DATE NOT NULL DEFAULT CURRENT_DATE, due_date DATE NOT NULL, status public.invoice_status NOT NULL DEFAULT 'PENDING', payment_date DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    -- Liên kết bảng transactions với invoices
    ALTER TABLE public.transactions
    ADD CONSTRAINT fk_invoice_id FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);`
    
    -- Thêm một loại giao dịch mới vào ENUM
    ALTER TYPE public.transaction_type ADD VALUE 'COD_SERVICE_FEE';
    

### **Task 2: Tích Hợp Ghi Nhận Giao Dịch**

- **File:** Các Server Action liên quan (handleCodDecision, handleStreetTurnApproval...).
- **Yêu cầu:**
    - Trong logic xử lý khi một yêu cầu được duyệt và có phát sinh phí, hãy thêm một bước INSERT vào bảng transactions.
    - **Ví dụ trong handleCodDecision:**Generated typescript
        
        `// ... sau khi UPDATE yêu cầu COD thành công ...
        if (cod_fee && cod_fee > 0) {
            await supabase.from('transactions').insert({
                payer_org_id: requesting_org_id,
                related_request_id: requestId,
                transaction_type: 'COD_FEE',
                amount: cod_fee,
                description: `Phí COD cho container ${containerNumber}`
            });
        }`
        

### **Logic Backend**

1. **Server Action handleCodDecision:**
    - **Đầu vào:** Phải nhận được cod_fee (kiểu number) từ form do người dùng nhập.
    - **Logic UPDATE cod_requests:**
        
        `// ...
        await supabase.from('cod_requests').update({ 
            status: 'APPROVED', 
            cod_fee: cod_fee // Lưu lại số tiền do Hãng tàu nhập
        }).eq('id', requestId);
        // ...`
        
    - **Logic INSERT phí dịch vụ của i-ContainerHub:**
        
        `// ... ngay sau khi update ở trên thành công ...
        const SERVICE_FEE = 20000; // Lấy từ file config hoặc biến môi trường
        
        await supabase.from('transactions').insert({
            payer_org_id: requesting_org_id,
            related_request_id: requestId,
            transaction_type: 'COD_SERVICE_FEE',
            amount: SERVICE_FEE,
            description: `Phí dịch vụ xử lý yêu cầu COD thành công`
        });`
        
2. **Server Action xử lý phê duyệt Street-turn Marketplace:**
    - **Logic INSERT phí dịch vụ:**
        
        `// ... sau khi update yêu cầu street-turn thành công ...
        const MARKETPLACE_FEE = 20000;
        
        await supabase.from('transactions').insert({
            payer_org_id: pickup_trucking_org_id, // Bên "mua" cơ hội sẽ trả phí
            related_request_id: requestId,
            transaction_type: 'MARKETPLACE_FEE',
            amount: MARKETPLACE_FEE,
            description: `Phí giao dịch thành công trên Thị trường`
        });`
        

### **Cập nhật Frontend**

- **File:** src/components/features/cod/CodDecisionDialogs.tsx (Tên giả định cho các dialog xử lý).
- **Yêu cầu:**
    - Trong Dialog "Phê duyệt (kèm phí)", phải có một ô **<Input type="number">** với nhãn **"Phí COD (VNĐ)"**.
    - Ô input này là bắt buộc khi chọn hành động này.
    - Giá trị từ ô input này phải được gửi đi cùng với form khi gọi Server Action handleCodDecision.

**Kết luận:**

Với sự điều chỉnh này, hệ thống của chúng ta giờ đã phân biệt rạch ròi:

- **Phí COD:** Là thỏa thuận giữa Hãng tàu và Công ty Vận tải. Hệ thống chỉ ghi nhận để minh bạch.
- **Phí Dịch Vụ (20.000 VNĐ):** Là doanh thu của i-ContainerHub, được tự động ghi nhận vào bảng transactions để sau này xuất hóa đơn.

### **Task 3: Xây Dựng Giao Diện Quản Lý Cho Admin**

- **File:** Trong khu vực Admin Dashboard (/admin).
- **Yêu cầu:**
    1. Tạo một trang mới **"Quản lý Tài chính"**.
    2. **Tab 1: "Giao dịch chưa xuất hóa đơn"**: Liệt kê tất cả các transactions có status = 'UNPAID', nhóm theo từng công ty. Admin có thể chọn các giao dịch và nhấn nút "Tạo Hóa đơn".
    3. **Tab 2: "Quản lý Hóa đơn"**: Liệt kê tất cả các invoices đã tạo. Admin có thể xem chi tiết, tải PDF, và quan trọng nhất là có nút **"Đánh dấu đã thanh toán"**.
    4. **Tạo Server Action markInvoiceAsPaid(invoiceId):** Action này sẽ cập nhật trạng thái của hóa đơn và các giao dịch liên quan thành PAID.

### **Task 4: Xây Dựng Giao Diện Cho Công Ty Vận Tải**

- **File:** Trong khu vực (main).
- **Yêu cầu:**
    1. Thêm một mục mới vào Sidebar: **"Thanh toán"**.
    2. Trang này (/billing) sẽ liệt kê tất cả các hóa đơn (invoices) của công ty họ.
    3. Cho phép họ xem chi tiết từng hóa đơn (liệt kê tất cả các giao dịch bên trong) và tải về file PDF.
    4. Hiển thị rõ ràng trạng thái: "Chưa thanh toán", "Đã thanh toán", "Quá hạn".

---

**Next Step (Bước Tiếp Theo):**

Đây là một module lớn, chúng ta nên triển khai theo từng bước.

1. **Bắt đầu với Backend:** Chạy mã SQL để tạo các bảng mới. Sau đó, tích hợp logic ghi nhận giao dịch vào các Server Action hiện có. Đây là bước nền tảng.
2. **Xây dựng Giao diện Admin:** Tạo các trang quản lý cho phép bạn (Admin) có thể tạo hóa đơn và xác nhận thanh toán. Luồng này có thể ban đầu khá thủ công.
3. **Xây dựng Giao diện cho Khách hàng:** Tạo trang "Thanh toán" để Công ty Vận tải có thể xem và theo dõi các hóa đơn của họ.
4. **Tự động hóa (Tương lai):** Sau khi các luồng thủ công đã chạy ổn, chúng ta có thể xây dựng Cron Job để tự động tạo hóa đơn hàng tháng và tích hợp cổng thanh toán trực tuyến.