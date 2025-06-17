-- Test stored function approve_cod_request với data giả

-- 1. Tạo test data (nếu cần)
-- Tìm một COD request PENDING để test
SELECT 
    id,
    status,
    dropoff_order_id,
    requested_depot_id,
    created_at
FROM cod_requests 
WHERE status = 'PENDING'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Test function với một request pending (thay đổi ID phù hợp)
-- SELECT public.approve_cod_request(
--     'YOUR_PENDING_REQUEST_ID'::UUID,
--     0::NUMERIC,
--     NULL::UUID,
--     'TEST_ORG'::TEXT
-- );

-- 3. Kiểm tra function definition
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'approve_cod_request';

-- 4. Kiểm tra quyền function
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'approve_cod_request'; 