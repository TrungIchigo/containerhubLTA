1. Thiết lập Coding Standards & Conventions
Tên gọi (Naming Conventions):
Biến và Hàm: Sử dụng camelCase. Tên phải là động từ hoặc cụm danh từ mô tả rõ hành động hoặc dữ liệu. Ví dụ: calculateCodFee, pendingRequestsList. Không dùng tên viết tắt mơ hồ như calcFee hay pndReq.
Component React/TSX: Sử dụng PascalCase (hay UpperCamelCase). Tên file phải trùng với tên component. Ví dụ: component LanguageSwitcher phải nằm trong file LanguageSwitcher.tsx.
Hằng số (Constants): Sử dụng UPPER_SNAKE_CASE. Ví dụ: MAX_UPLOAD_SIZE, DEFAULT_PAGE_SIZE.
Types/Interfaces (TypeScript): Sử dụng PascalCase, có thể thêm hậu tố Type hoặc Props để làm rõ. Ví dụ: CodRequest, DashboardPageProps.
Định dạng Code (Formatting):
Luôn chạy Prettier tự động khi lưu file ("editor.formatOnSave": true). Sử dụng cấu hình Prettier đã được định nghĩa trong file .prettierrc của dự án.
Indentation: Luôn sử dụng 2 dấu cách (spaces).
Độ dài dòng: Tối đa 120 ký tự. Tự động xuống dòng nếu vượt quá.
Comments & Documentation:
Bắt buộc JSDoc: Mọi hàm (function) và Server Action mới được tạo phải có một khối comment JSDoc ở trên, mô tả rõ: mục đích của hàm (@description), các tham số đầu vào (@param), và giá trị trả về (@returns).
Comment Giải thích: Thêm comment // cho các dòng code có logic phức tạp, các thuật toán, hoặc các đoạn code "tạm thời" cần được xử lý sau. Không comment những thứ đã rõ ràng.
2. Keep It Simple & Modular
Nguyên tắc "Một chức năng, một nhiệm vụ" (Single Responsibility Principle):
Mỗi hàm, mỗi component chỉ nên làm một việc duy nhất và làm tốt việc đó.
Quy tắc: Nếu một hàm dài hơn 30-40 dòng hoặc có nhiều hơn 3-4 mức lồng vào nhau, hãy tách nó thành các hàm con nhỏ hơn.
Quy tắc: Nếu một component TSX có nhiều hơn 200-250 dòng, hãy xem xét việc tách nó thành các component con.
Cấu trúc Module:
Toàn bộ mã nguồn phải nằm trong thư mục src/.
Component Tái sử dụng: Đặt trong src/components/ui/ (cho Shadcn) và src/components/common/.
Component Chuyên biệt: Đặt trong src/components/features/[feature-name]/.
Hàm Logic: Đặt trong src/lib/.
Custom Hooks: Đặt trong src/hooks/.
API Routes & Server Actions: Phải được tổ chức trong các thư mục tương ứng trong src/app/.
3. Test-Driven Development (TDD) & Unit Tests
Yêu cầu về Unit Test:
Đối với mọi hàm logic mới được tạo trong src/lib/ (ví dụ: validateContainerNumber, calculateMatchScore), bắt buộc phải tạo một file test tương ứng (ví dụ: utils.test.ts) sử dụng Jest hoặc Vitest.
Mỗi file test phải bao gồm các kịch bản: trường hợp thành công (happy path), trường hợp ngoại lệ (edge cases), và trường hợp đầu vào không hợp lệ.
Tên gọi Test Case: Tên của mỗi test case phải mô tả rõ ràng kịch bản đang kiểm thử theo cấu trúc: it('should [hành động mong đợi] when [điều kiện xảy ra]'). Ví dụ: it('should return true for a valid ISO 6346 container number').
4. CI/CD & Automation
Cam kết về Chất lượng: Mọi commit được đẩy lên các nhánh main hoặc develop bắt buộc phải vượt qua tất cả các bước trong pipeline CI/CD (linting, type checking, unit tests, build).
Quy tắc Merge: Pull Request (PR) chỉ được phép merge khi đã được ít nhất một Senior Developer khác review và CI pipeline báo trạng thái "Passed" (xanh).
5. Review & Accountability
Trách nhiệm của Developer: Developer là người chịu trách nhiệm cuối cùng cho đoạn code do AI tạo ra. Phải đọc hiểu, kiểm tra và tinh chỉnh lại code trước khi commit. Nghiêm cấm việc sao chép-dán mù quáng.
Checklist cho Code Review:
Code có tuân thủ các Coding Standards ở trên không?
Code có được viết đơn giản, dễ hiểu không?
Code có được cover bởi Unit Test không?
Code có tiềm ẩn các vấn đề về hiệu năng (ví dụ: query N+1) hoặc bảo mật (ví dụ: SQL injection - dù Supabase đã bảo vệ) không?
6. Documentation & Project Context
Tài liệu hóa Yêu cầu: Mọi tính năng lớn mới phải có một file Markdown mô tả chi tiết luồng nghiệp vụ và các kịch bản liên quan trước khi bắt đầu code (như chúng ta đang làm).
Cập nhật README.md: README.md của dự án phải luôn được cập nhật, bao gồm:
Hướng dẫn cài đặt và chạy dự án ở local.
Mô tả các biến môi trường cần thiết.
Link đến các tài liệu quan trọng khác.
7. Prompt Engineering & Iterative Process
Nguyên tắc Prompt: Khi yêu cầu AI viết code, prompt phải bao gồm:
Ngữ cảnh rõ ràng: "Trong dự án i-ContainerHub, tôi đang xây dựng một component React..."
Mục tiêu cụ thể: "...để hiển thị danh sách các gợi ý street-turn."
Yêu cầu kỹ thuật: "Sử dụng Next.js App Router, TypeScript, Tailwind CSS, và các component từ thư viện Shadcn/ui. Dữ liệu đầu vào (props) sẽ có kiểu là..."
Các quy tắc đã định: "Hãy tuân thủ các quy tắc coding đã được thiết lập (JSDoc, PascalCase...)."
Quy trình Lặp lại:
Generate: Gửi prompt và nhận kết quả ban đầu từ AI.
Review: Developer đọc và kiểm tra code do AI sinh ra.
Refine (Tinh chỉnh): Gửi các prompt tiếp theo để sửa lỗi, tối ưu hóa hoặc thêm các trường hợp ngoại lệ mà AI đã bỏ qua. Quá trình này lặp lại cho đến khi code đạt yêu cầu.