-- =====================================================
-- COMPREHENSIVE TEST DATASET FOR CONTAINERHUB
-- Bao gồm tất cả scenarios: Internal matching, COD, Marketplace, Street-turn
-- 
-- CONTAINER NUMBERS (ISO 6346 STANDARD):
-- Format: 3 chữ cái (owner code) + 1 chữ cái (equipment category, thường là 'U') + 6 chữ số + 1 check digit
-- Total: 11 ký tự
-- Examples used from validated list:
-- - CSQU3054383, MSKU6856625, TCLU4265727, FCIU8412630, TRLU9876545
-- - CMAU4567891, APMU1234564, SUDU5789104, OOLU2048585, HLXU8097426
-- - EGHU9012340, INBU3344558, YMLU8889998, ZIMU7013459, SEGU5432109
-- - HJCU1122336, TCKU6543210, UACU5987452, MAEU8001239, TGHU7777774
-- =====================================================

-- BƯỚC 1: XÓA DỮ LIỆU CŨ (NÕU CÓ)
-- Warning: Chỉ chạy trên môi trường test!
DELETE FROM public.partner_reviews;
DELETE FROM public.cod_audit_logs;
DELETE FROM public.cod_requests;
DELETE FROM public.street_turn_requests;
DELETE FROM public.export_bookings;
DELETE FROM public.import_containers;
DELETE FROM public.profiles WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@test-dataset.com'
);
-- Note: Không xóa organizations vì có thể có ràng buộc

-- BƯỚC 2: DỮ LIỆU ĐÃ CÓ TRONG HỆ THỐNG
-- Sử dụng organizations và container_types hiện có từ production

-- Mapping Organizations (từ production data):
-- Trucking Companies:
-- '3f5d6d08-88f9-428b-828b-b9ba95c86aea' = 'Vận Tải Miền Bắc'
-- '67f5d213-58ae-40d4-b13a-380b4c811061' = 'Vận Tải Sài Gòn Express'  
-- '2fa53420-600e-4e34-9cf2-25e328e1b42e' = 'Vận Tải Đông Nam Á'
-- 'ac3f8b2c-0e03-4694-92ff-53a6d5182ac2' = 'Vận Tải Hải Phòng'
-- '1286056c-e51e-42fa-b542-f018d8a8089c' = 'Vận Tải Long An'

-- Shipping Lines:
-- '779ddc11-2470-4e37-93d5-728cff6613cd' = 'Hapag-Lloyd Vietnam'
-- 'b62863dc-4f87-4d5c-9f14-2f52821239ca' = 'COSCO Vietnam'
-- '26e5fe8f-e7fe-4d3f-8624-26e470ca20bf' = 'ONE Vietnam'
-- 'cf13f5d6-d875-4e5e-95b9-1cf18420952c' = 'Evergreen Vietnam'
-- '4e2bf368-fb09-40e5-82dd-851eba658e5e' = 'MSC Vietnam'

-- Mapping Container Types (từ production data):
-- '106815aa-56d2-4e31-a15a-ef7bdbfe5d97' = '20DC'
-- '2973a078-bdb4-4a12-9717-aa596fc81f7c' = '40DC'
-- 'babd2f38-1da9-492f-98fb-599865a556f7' = '40HC'
-- '3063f1c9-2f7b-47e1-a4cb-38d1ecf79f13' = '20RF'
-- '151ab168-16fc-4679-a14a-617486235399' = '40RF'

-- BƯỚC 3: TẠO DỮ LIỆU IMPORT CONTAINERS (LỆNH GIAO TRẢ)
-- Case 1: Ghép lệnh nội bộ THÀNH CÔNG
INSERT INTO public.import_containers (id, container_number, container_type, container_type_id, drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id, status, is_listed_on_marketplace, created_at) VALUES
    -- Case 1: Ghép lệnh nội bộ THÀNH CÔNG (ISO 6346 validated containers)
    (gen_random_uuid(), 'CSQU3054383', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Cảng Cát Lái, TP.HCM', NOW() + INTERVAL '1 day', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '779ddc11-2470-4e37-93d5-728cff6613cd', 'AVAILABLE', false, NOW() - INTERVAL '2 hours'),
    (gen_random_uuid(), 'MSKU6856625', '40HC', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Thuận, TP.HCM', NOW() + INTERVAL '2 days', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '779ddc11-2470-4e37-93d5-728cff6613cd', 'AVAILABLE', false, NOW() - INTERVAL '1 hour'),
    
    -- Case 2: Ghép lệnh nội bộ THẤT BẠI (không khớp container type)
    (gen_random_uuid(), 'TCLU4265727', '20RF', '3063f1c9-2f7b-47e1-a4cb-38d1ecf79f13', 'Depot COSCO, Quận 7', NOW() + INTERVAL '1 day', '67f5d213-58ae-40d4-b13a-380b4c811061', 'b62863dc-4f87-4d5c-9f14-2f52821239ca', 'AVAILABLE', false, NOW() - INTERVAL '3 hours'),
    
    -- Case 3: Cơ hội COD (nơi trả mặc định không thuận lợi)
    (gen_random_uuid(), 'FCIU8412630', '40DC', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Depot ONE, Bình Dương', NOW() + INTERVAL '1 day', '2fa53420-600e-4e34-9cf2-25e328e1b42e', '26e5fe8f-e7fe-4d3f-8624-26e470ca20bf', 'AVAILABLE', false, NOW() - INTERVAL '4 hours'),  
    (gen_random_uuid(), 'TRLU9876545', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Depot Evergreen, Đồng Nai', NOW() + INTERVAL '2 days', 'ac3f8b2c-0e03-4694-92ff-53a6d5182ac2', 'cf13f5d6-d875-4e5e-95b9-1cf18420952c', 'AVAILABLE', false, NOW() - INTERVAL '5 hours'),
    
    -- Case 4: Cơ hội MARKETPLACE (chào bán công khai)
    (gen_random_uuid(), 'CMAU4567891', '40HC', 'babd2f38-1da9-492f-98fb-599865a556f7', 'Cảng Cát Lái, TP.HCM', NOW() + INTERVAL '1 day', '1286056c-e51e-42fa-b542-f018d8a8089c', '4e2bf368-fb09-40e5-82dd-851eba658e5e', 'AVAILABLE', true, NOW() - INTERVAL '6 hours'),
    (gen_random_uuid(), 'APMU1234564', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Tân Thuận, TP.HCM', NOW() + INTERVAL '2 days', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '779ddc11-2470-4e37-93d5-728cff6613cd', 'AVAILABLE', true, NOW() - INTERVAL '7 hours'),
    
    -- Case 5: Cơ hội COD + Street-turn (quá xa)
    (gen_random_uuid(), 'SUDU5789104', '40DC', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Depot COSCO, Vũng Tàu', NOW() + INTERVAL '1 day', '67f5d213-58ae-40d4-b13a-380b4c811061', 'b62863dc-4f87-4d5c-9f14-2f52821239ca', 'AVAILABLE', false, NOW() - INTERVAL '8 hours'),
    
    -- Case 6: Dữ liệu "nhiễu" (trạng thái không sẵn sàng)
    (gen_random_uuid(), 'OOLU2048585', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Cảng Cát Lái, TP.HCM', NOW() + INTERVAL '1 day', '2fa53420-600e-4e34-9cf2-25e328e1b42e', '779ddc11-2470-4e37-93d5-728cff6613cd', 'AWAITING_APPROVAL', false, NOW() - INTERVAL '9 hours'),
    (gen_random_uuid(), 'HLXU8097426', '40HC', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Thuận, TP.HCM', NOW() + INTERVAL '2 days', 'ac3f8b2c-0e03-4694-92ff-53a6d5182ac2', '779ddc11-2470-4e37-93d5-728cff6613cd', 'CONFIRMED', false, NOW() - INTERVAL '10 hours'),
    
    -- Case 7: Dữ liệu đa dạng cho filters (hãng tàu, loại container khác nhau)
    (gen_random_uuid(), 'EGHU9012340', '20RF', '3063f1c9-2f7b-47e1-a4cb-38d1ecf79f13', 'Depot ONE, Quận 9', NOW() + INTERVAL '3 days', '1286056c-e51e-42fa-b542-f018d8a8089c', '26e5fe8f-e7fe-4d3f-8624-26e470ca20bf', 'AVAILABLE', true, NOW() - INTERVAL '11 hours'),
    (gen_random_uuid(), 'INBU3344558', '40RF', '151ab168-16fc-4679-a14a-617486235399', 'Depot Evergreen, Thủ Đức', NOW() + INTERVAL '4 days', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', 'cf13f5d6-d875-4e5e-95b9-1cf18420952c', 'AVAILABLE', false, NOW() - INTERVAL '12 hours'),
    (gen_random_uuid(), 'YMLU8889998', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Cảng Cát Lái, TP.HCM', NOW() + INTERVAL '5 days', '67f5d213-58ae-40d4-b13a-380b4c811061', '4e2bf368-fb09-40e5-82dd-851eba658e5e', 'AVAILABLE', true, NOW() - INTERVAL '13 hours');


-- BƯỚC 4: TẠO DỮ LIỆU EXPORT BOOKINGS (LỆNH LẤY RỖNG)
INSERT INTO public.export_bookings (id, booking_number, required_container_type, container_type_id, pick_up_location, needed_by_datetime, trucking_company_org_id, status, created_at) VALUES
    -- Case 1: Ghép nội bộ THÀNH CÔNG với import containers ở trên
    (gen_random_uuid(), 'SGN2024001', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Khu Công Nghiệp Tân Thuận, TP.HCM', NOW() + INTERVAL '3 days', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', 'AVAILABLE', NOW() - INTERVAL '1 hour'),
    (gen_random_uuid(), 'SGN2024002', '40HC', 'babd2f38-1da9-492f-98fb-599865a556f7', 'Khu Công Nghiệp Hiệp Phước, TP.HCM', NOW() + INTERVAL '4 days', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', 'AVAILABLE', NOW() - INTERVAL '30 minutes'),
    
    -- Case 2: Ghép nội bộ THẤT BẠI (yêu cầu container type khác)
    (gen_random_uuid(), 'SGN2024003', '40DC', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Khu Công Nghiệp Sóng Thần, Bình Dương', NOW() + INTERVAL '3 days', '67f5d213-58ae-40d4-b13a-380b4c811061', 'AVAILABLE', NOW() - INTERVAL '2 hours'),
    
    -- Case 3: Nhu cầu cho COD (gần địa điểm cần lấy hơn)
    (gen_random_uuid(), 'SGN2024004', '40DC', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Khu Công Nghiệp Tân Thuận, TP.HCM', NOW() + INTERVAL '3 days', '2fa53420-600e-4e34-9cf2-25e328e1b42e', 'AVAILABLE', NOW() - INTERVAL '3 hours'),
    (gen_random_uuid(), 'SGN2024005', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Khu Công Nghiệp Biên Hòa, Đồng Nai', NOW() + INTERVAL '4 days', 'ac3f8b2c-0e03-4694-92ff-53a6d5182ac2', 'AVAILABLE', NOW() - INTERVAL '4 hours'),
    
    -- Case 4: Nhu cầu MARKETPLACE (từ công ty khác)
    (gen_random_uuid(), 'SGN2024006', '40HC', 'babd2f38-1da9-492f-98fb-599865a556f7', 'Khu Công Nghiệp Cát Lái, TP.HCM', NOW() + INTERVAL '3 days', '67f5d213-58ae-40d4-b13a-380b4c811061', 'AVAILABLE', NOW() - INTERVAL '5 hours'),
    (gen_random_uuid(), 'SGN2024007', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Khu Công Nghiệp Tân Bình, TP.HCM', NOW() + INTERVAL '4 days', '2fa53420-600e-4e34-9cf2-25e328e1b42e', 'AVAILABLE', NOW() - INTERVAL '6 hours'),
    
    -- Case 5: Nhu cầu cho Street-turn kết hợp COD
    (gen_random_uuid(), 'SGN2024008', '40DC', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Khu Công Nghiệp Phú Mỹ, Vũng Tàu', NOW() + INTERVAL '3 days', '1286056c-e51e-42fa-b542-f018d8a8089c', 'AVAILABLE', NOW() - INTERVAL '7 hours'),
    
    -- Case 6: Dữ liệu "nhiễu"
    (gen_random_uuid(), 'SGN2024009', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Khu Công Nghiệp Tân Thuận, TP.HCM', NOW() + INTERVAL '3 days', '2fa53420-600e-4e34-9cf2-25e328e1b42e', 'AWAITING_APPROVAL', NOW() - INTERVAL '8 hours'),
    (gen_random_uuid(), 'SGN2024010', '40HC', 'babd2f38-1da9-492f-98fb-599865a556f7', 'Khu Công Nghiệp Hiệp Phước, TP.HCM', NOW() + INTERVAL '4 days', 'ac3f8b2c-0e03-4694-92ff-53a6d5182ac2', 'CONFIRMED', NOW() - INTERVAL '9 hours'),
    
    -- Case 7: Dữ liệu đa dạng cho filters
    (gen_random_uuid(), 'SGN2024011', '20RF', '3063f1c9-2f7b-47e1-a4cb-38d1ecf79f13', 'Khu Công Nghiệp Quang Minh, TP.HCM', NOW() + INTERVAL '5 days', '1286056c-e51e-42fa-b542-f018d8a8089c', 'AVAILABLE', NOW() - INTERVAL '10 hours'),
    (gen_random_uuid(), 'SGN2024012', '40RF', '151ab168-16fc-4679-a14a-617486235399', 'Khu Công Nghiệp Long Hậu, Long An', NOW() + INTERVAL '6 days', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', 'AVAILABLE', NOW() - INTERVAL '11 hours'),
    (gen_random_uuid(), 'SGN2024013', '20DC', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Khu Công Nghiệp Tân Tạo, TP.HCM', NOW() + INTERVAL '7 days', '67f5d213-58ae-40d4-b13a-380b4c811061', 'AVAILABLE', NOW() - INTERVAL '12 hours');

-- BƯỚC 5: TẠO STREET TURN REQUESTS (MỘT SỐ ĐÃ XỬ LÝ)
INSERT INTO public.street_turn_requests (id, import_container_id, export_booking_id, dropoff_trucking_org_id, pickup_trucking_org_id, approving_org_id, match_type, dropoff_org_approval_status, pickup_org_approval_status, carrier_approval_status, status, estimated_cost_saving, estimated_co2_saving_kg, created_at) VALUES
    -- Case 1: Ghép nội bộ thành công (đã APPROVED)
    (gen_random_uuid(), 'ic-success-internal-001', 'eb-success-internal-001', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '779ddc11-2470-4e37-93d5-728cff6613cd', 'INTERNAL', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 2500000, 150, NOW() - INTERVAL '6 hours'),
    
    -- Case 2: Marketplace request đang PENDING
    (gen_random_uuid(), 'ic-marketplace-001', 'eb-marketplace-001', '1286056c-e51e-42fa-b542-f018d8a8089c', '67f5d213-58ae-40d4-b13a-380b4c811061', '4e2bf368-fb09-40e5-82dd-851eba658e5e', 'MARKETPLACE', 'APPROVED', 'APPROVED', 'PENDING', 'PENDING', 3200000, 200, NOW() - INTERVAL '2 hours'),
    
    -- Case 3: Request bị DECLINED
    (gen_random_uuid(), 'ic-marketplace-002', 'eb-marketplace-002', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '2fa53420-600e-4e34-9cf2-25e328e1b42e', '779ddc11-2470-4e37-93d5-728cff6613cd', 'MARKETPLACE', 'APPROVED', 'APPROVED', 'DECLINED', 'DECLINED', 2800000, 180, NOW() - INTERVAL '24 hours'),
    
    -- Case 4: Internal request nhưng fail do thời gian không khớp
    (gen_random_uuid(), 'ic-success-internal-002', 'eb-success-internal-002', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '779ddc11-2470-4e37-93d5-728cff6613cd', 'INTERNAL', 'PENDING', 'PENDING', 'PENDING', 'PENDING', 2200000, 140, NOW() - INTERVAL '30 minutes');

-- BƯỚC 6: TẠO COD REQUESTS
INSERT INTO public.cod_requests (id, dropoff_order_id, requesting_org_id, approving_org_id, requested_depot_name, requested_depot_address, cod_fee_amount, status, expires_at, created_at) VALUES
    -- COD request đang chờ phê duyệt
    (gen_random_uuid(), 'ic-cod-opportunity-001', '2fa53420-600e-4e34-9cf2-25e328e1b42e', '26e5fe8f-e7fe-4d3f-8624-26e470ca20bf', 'Depot Cát Lái', 'Cảng Cát Lái, Quận 2, TP.HCM', 500000, 'PENDING', NOW() + INTERVAL '20 hours', NOW() - INTERVAL '4 hours'),
    
    -- COD request đã được approve
    (gen_random_uuid(), 'ic-cod-opportunity-002', 'ac3f8b2c-0e03-4694-92ff-53a6d5182ac2', 'cf13f5d6-d875-4e5e-95b9-1cf18420952c', 'ICD Tân Thuận', 'ICD Tân Thuận, Quận 7, TP.HCM', 600000, 'APPROVED', NOW() + INTERVAL '44 hours', NOW() - INTERVAL '20 hours'),
    
    -- COD request bị declined
    (gen_random_uuid(), 'ic-cod-streetturn-001', '67f5d213-58ae-40d4-b13a-380b4c811061', 'b62863dc-4f87-4d5c-9f14-2f52821239ca', 'Depot COSCO TP.HCM', 'Cảng Cát Lái, TP.HCM', 800000, 'DECLINED', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '26 hours');

-- BƯỚC 7: TẠO PARTNER REVIEWS (CHO CÁC GIAO DỊCH ĐÃ HOÀN THÀNH)
INSERT INTO public.partner_reviews (id, request_id, reviewer_org_id, reviewee_org_id, rating, comment, created_at) VALUES
    -- Review cho giao dịch internal thành công
    (gen_random_uuid(), 'str-internal-approved-001', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', '779ddc11-2470-4e37-93d5-728cff6613cd', 5, 'Hãng tàu phê duyệt nhanh chóng, quy trình rất thuận lợi!', NOW() - INTERVAL '2 hours'),
    
    -- Review cho giao dịch marketplace bị decline
    (gen_random_uuid(), 'str-declined-001', '2fa53420-600e-4e34-9cf2-25e328e1b42e', '779ddc11-2470-4e37-93d5-728cff6613cd', 2, 'Hãng tàu từ chối không rõ lý do, cần cải thiện giao tiếp.', NOW() - INTERVAL '20 hours'),
    
    -- Review ngược lại từ hãng tàu
    (gen_random_uuid(), 'str-internal-approved-001', '779ddc11-2470-4e37-93d5-728cff6613cd', '3f5d6d08-88f9-428b-828b-b9ba95c86aea', 4, 'Công ty vận tải làm việc chuyên nghiệp, giao container đúng giờ.', NOW() - INTERVAL '1 hour');

-- BƯỚC 8: TẠO AUDIT LOGS CHO COD
INSERT INTO public.cod_audit_logs (id, request_id, actor_user_id, actor_org_name, action, details, created_at) VALUES
    -- Log cho COD approved
    (gen_random_uuid(), 'cod-approved-001', NULL, 'Evergreen Vietnam', 'APPROVED', '{"fee": 600000, "reason": "Depot available, reasonable fee"}', NOW() - INTERVAL '19 hours'),
    
    -- Log cho COD declined  
    (gen_random_uuid(), 'cod-declined-001', NULL, 'COSCO Vietnam', 'DECLINED', '{"reason": "Fee too high, depot at capacity"}', NOW() - INTERVAL '25 hours'),
    
    -- Log cho COD creation
    (gen_random_uuid(), 'cod-pending-001', NULL, 'Vận Tải Đông Nam Á', 'CREATED', '{"requested_depot": "Depot Cát Lái", "fee": 500000}', NOW() - INTERVAL '4 hours');

-- BƯỚC 9: KIỂM TRA DỮ LIỆU ĐÃ TẠO
-- Hiển thị tổng quan dữ liệu test sử dụng data production hiện có
SELECT 'TEST DATASET SUMMARY' as report_type, 
       'Organizations (Production Data)' as table_name, 
       COUNT(*) as record_count 
FROM public.organizations

UNION ALL

SELECT 'TEST DATASET SUMMARY' as report_type,
       'Container Types (Production Data)' as table_name, 
       COUNT(*) as record_count 
FROM public.container_types

UNION ALL

SELECT 'TEST DATASET SUMMARY' as report_type,
       'Import Containers (Test Data)' as table_name, 
       COUNT(*) as record_count 
FROM public.import_containers
WHERE id LIKE 'ic-%'

UNION ALL

SELECT 'TEST DATASET SUMMARY' as report_type,
       'Export Bookings (Test Data)' as table_name, 
       COUNT(*) as record_count 
FROM public.export_bookings  
WHERE id LIKE 'eb-%'

UNION ALL

SELECT 'TEST DATASET SUMMARY' as report_type,
       'Street Turn Requests (Test Data)' as table_name, 
       COUNT(*) as record_count 
FROM public.street_turn_requests
WHERE id LIKE 'str-%'

UNION ALL

SELECT 'TEST DATASET SUMMARY' as report_type,
       'COD Requests (Test Data)' as table_name, 
       COUNT(*) as record_count 
FROM public.cod_requests
WHERE id LIKE 'cod-%'

UNION ALL

SELECT 'TEST DATASET SUMMARY' as report_type,
       'Partner Reviews (Test Data)' as table_name, 
       COUNT(*) as record_count 
FROM public.partner_reviews
WHERE id LIKE 'review-%';

-- BƯỚC 10: HIỂN THỊ CÁC TEST CASES
SELECT 
    'INTERNAL MATCHING SUCCESS' as test_case,
    ic.container_number,
    eb.booking_number,
    o.name as company,
    str.status as request_status
FROM public.import_containers ic
JOIN public.export_bookings eb ON ic.trucking_company_org_id = eb.trucking_company_org_id
JOIN public.organizations o ON ic.trucking_company_org_id = o.id
LEFT JOIN public.street_turn_requests str ON ic.id = str.import_container_id AND eb.id = str.export_booking_id
WHERE ic.id = 'ic-success-internal-001'

UNION ALL

SELECT 
    'MARKETPLACE OPPORTUNITY' as test_case,
    ic.container_number,
    'Available to all' as booking_number,
    o.name as company,
    CASE WHEN ic.is_listed_on_marketplace THEN 'LISTED' ELSE 'NOT_LISTED' END as request_status
FROM public.import_containers ic
JOIN public.organizations o ON ic.trucking_company_org_id = o.id
WHERE ic.is_listed_on_marketplace = true
LIMIT 2

UNION ALL

SELECT 
    'COD OPPORTUNITY' as test_case,
    ic.container_number,
    cod.requested_depot_name as booking_number,
    o.name as company,
    cod.status as request_status
FROM public.cod_requests cod
JOIN public.import_containers ic ON cod.dropoff_order_id = ic.id
JOIN public.organizations o ON cod.requesting_org_id = o.id
LIMIT 3;

-- VERIFY CONTAINER NUMBERS COMPLIANCE
SELECT 
    'ISO 6346 VALIDATION CHECK' as validation_status,
    container_number,
    CASE 
        WHEN LENGTH(container_number) = 11 THEN 'CORRECT_LENGTH'
        ELSE 'WRONG_LENGTH'
    END as length_check,
    CASE 
        WHEN container_number ~ '^[A-Z]{3}[A-Z][0-9]{6}[0-9]$' THEN 'CORRECT_FORMAT'
        ELSE 'WRONG_FORMAT'
    END as format_check
FROM public.import_containers 
WHERE id LIKE 'ic-%'
ORDER BY container_number;

SELECT 'Test dataset created successfully!' as status; 