-- Test và Verify COD Flow hoàn chỉnh
-- Script này kiểm tra và sửa lỗi trong COD flow nếu có

-- 1. Kiểm tra các COD requests và container status hiện tại
SELECT 
    'Current COD Status Overview' as report_section,
    cr.status as cod_status,
    ic.status as container_status,
    COUNT(*) as count
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
GROUP BY cr.status, ic.status
ORDER BY cr.status, ic.status;

-- 2. Tìm các container có status không khớp với COD flow
SELECT 
    'Containers with Incorrect Status' as report_section,
    cr.id as cod_request_id,
    cr.status as cod_status,
    ic.id as container_id,
    ic.container_number,
    ic.status as container_status,
    'Status Mismatch' as issue,
    CASE 
        WHEN cr.status = 'PENDING' AND ic.status != 'AWAITING_COD_APPROVAL' 
            THEN 'Container should be AWAITING_COD_APPROVAL'
        WHEN cr.status = 'APPROVED' AND ic.status NOT IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'PROCESSING', 'COMPLETED')
            THEN 'Container should be AWAITING_COD_PAYMENT'
        WHEN cr.status = 'DECLINED' AND ic.status != 'COD_REJECTED'
            THEN 'Container should be COD_REJECTED'
        WHEN cr.status = 'PENDING_PAYMENT' AND ic.status != 'COMPLETED'
            THEN 'Container should be COMPLETED (old flow)'
        WHEN cr.status = 'PAID' AND ic.status != 'ON_GOING_COD'
            THEN 'Container should be ON_GOING_COD'
        WHEN cr.status = 'PROCESSING_AT_DEPOT' AND ic.status != 'PROCESSING'
            THEN 'Container should be PROCESSING'
        WHEN cr.status = 'COMPLETED' AND ic.status != 'COMPLETED'
            THEN 'Container should be COMPLETED'
        ELSE 'Status OK'
    END as expected_fix
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
WHERE 
    (cr.status = 'PENDING' AND ic.status != 'AWAITING_COD_APPROVAL') OR
    (cr.status = 'APPROVED' AND ic.status NOT IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'PROCESSING', 'COMPLETED')) OR
    (cr.status = 'DECLINED' AND ic.status != 'COD_REJECTED') OR
    (cr.status = 'PAID' AND ic.status != 'ON_GOING_COD') OR
    (cr.status = 'PROCESSING_AT_DEPOT' AND ic.status != 'PROCESSING') OR
    (cr.status = 'COMPLETED' AND ic.status != 'COMPLETED');

-- 3. Fix containers with APPROVED COD but wrong status
UPDATE import_containers 
SET status = 'AWAITING_COD_PAYMENT'
WHERE id IN (
    SELECT ic.id 
    FROM import_containers ic
    INNER JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
    WHERE cr.status = 'APPROVED' 
    AND ic.status NOT IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'PROCESSING', 'COMPLETED')
);

-- 4. Fix containers with DECLINED COD but wrong status  
UPDATE import_containers 
SET status = 'COD_REJECTED'
WHERE id IN (
    SELECT ic.id 
    FROM import_containers ic
    INNER JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
    WHERE cr.status = 'DECLINED' 
    AND ic.status != 'COD_REJECTED'
);

-- 5. Fix containers with PAID COD but wrong status
UPDATE import_containers 
SET status = 'ON_GOING_COD'
WHERE id IN (
    SELECT ic.id 
    FROM import_containers ic
    INNER JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
    WHERE cr.status = 'PAID' 
    AND ic.status != 'ON_GOING_COD'
);

-- 6. Fix containers with PROCESSING_AT_DEPOT COD but wrong status
UPDATE import_containers 
SET status = 'PROCESSING'
WHERE id IN (
    SELECT ic.id 
    FROM import_containers ic
    INNER JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
    WHERE cr.status = 'PROCESSING_AT_DEPOT' 
    AND ic.status != 'PROCESSING'
);

-- 7. Fix containers with COMPLETED COD but wrong status
UPDATE import_containers 
SET status = 'COMPLETED'
WHERE id IN (
    SELECT ic.id 
    FROM import_containers ic
    INNER JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
    WHERE cr.status = 'COMPLETED' 
    AND ic.status != 'COMPLETED'
);

-- 8. Verify fixes - Should show no mismatches after running fixes
SELECT 
    'Post-Fix Verification' as report_section,
    cr.id as cod_request_id,
    cr.status as cod_status,
    ic.id as container_id,
    ic.container_number,
    ic.status as container_status,
    'Fixed' as status
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
WHERE 
    (cr.status = 'APPROVED' AND ic.status = 'AWAITING_COD_PAYMENT') OR
    (cr.status = 'DECLINED' AND ic.status = 'COD_REJECTED') OR
    (cr.status = 'PAID' AND ic.status = 'ON_GOING_COD') OR
    (cr.status = 'PROCESSING_AT_DEPOT' AND ic.status = 'PROCESSING') OR
    (cr.status = 'COMPLETED' AND ic.status = 'COMPLETED');

-- 9. Test COD approval function
/*
-- Example test (replace with actual UUIDs from your data):
SELECT approve_cod_request(
    'your-cod-request-uuid-here',  -- request_id
    50000,                         -- cod_fee (50,000 VND)
    'your-user-uuid-here',         -- actor_user_id
    'LTA Admin'                    -- actor_org_name
);
*/

-- 10. Test COD rejection function
/*
-- Example test (replace with actual UUIDs from your data):
SELECT reject_cod_request(
    'your-cod-request-uuid-here',  -- request_id
    'Depot không phù hợp',        -- reason_for_decision
    'your-user-uuid-here',         -- actor_user_id
    'LTA Admin'                    -- actor_org_name
);
*/

-- 11. Show COD flow summary for debugging
SELECT 
    'COD Flow Summary' as report_section,
    cr.id,
    ic.container_number,
    cr.status as cod_status,
    ic.status as container_status,
    cr.created_at,
    cr.approved_at,
    cr.declined_at,
    cr.payment_confirmed_at,
    cr.completed_at,
    org.name as requesting_org
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
LEFT JOIN organizations org ON cr.requesting_org_id = org.id
ORDER BY cr.created_at DESC
LIMIT 20;

-- 12. Show containers ready for each COD action
SELECT 
    'Containers Ready for Actions' as report_section,
    CASE 
        WHEN ic.status = 'AWAITING_COD_PAYMENT' THEN 'Ready for Payment'
        WHEN ic.status = 'ON_GOING_COD' THEN 'Ready for Completion Confirmation'
        WHEN ic.status = 'PROCESSING' AND cr.status = 'PROCESSING_AT_DEPOT' THEN 'Ready for Depot Completion'
        ELSE 'No Action Required'
    END as action_required,
    ic.container_number,
    ic.status as container_status,
    cr.status as cod_status,
    cr.cod_fee
FROM import_containers ic
JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
WHERE ic.status IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'PROCESSING')
AND cr.status IN ('APPROVED', 'PAID', 'PROCESSING_AT_DEPOT')
ORDER BY ic.status, ic.container_number; 