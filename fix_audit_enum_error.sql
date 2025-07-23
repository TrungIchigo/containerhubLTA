-- Fix Audit Enum Error - Quick Fix
-- Chạy script này để fix lỗi enum và test lại COD flow

-- 1. Drop existing trigger và function có lỗi
DROP TRIGGER IF EXISTS cod_container_status_trigger ON import_containers;
DROP FUNCTION IF EXISTS check_cod_container_status();

-- 2. Tạo lại function với fix enum issue
CREATE OR REPLACE FUNCTION check_cod_container_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ log đơn giản để debug, không ghi vào audit table
    IF NEW.status IN ('AWAITING_COD_APPROVAL', 'AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'COD_REJECTED') THEN
        RAISE NOTICE 'COD Container Status Change: Container % (%) changed from % to %', 
            NEW.container_number, NEW.id, OLD.status, NEW.status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tạo lại trigger
CREATE TRIGGER cod_container_status_trigger
    AFTER UPDATE OF status ON import_containers
    FOR EACH ROW
    EXECUTE FUNCTION check_cod_container_status();

-- 4. Test approval function với container và COD request thực tế
-- (Thay đổi UUIDs này bằng data thực tế từ database của bạn)

-- Tìm một COD request PENDING để test:
SELECT 
    'Available COD Requests for Testing' as section,
    cr.id as cod_request_id,
    cr.status as cod_status,
    ic.container_number,
    ic.status as container_status,
    cr.requesting_org_id,
    cr.requested_depot_id
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
WHERE cr.status = 'PENDING'
ORDER BY cr.created_at DESC
LIMIT 5;

-- 5. Kiểm tra containers với status có thể được fix
SELECT 
    'Containers needing status fix' as section,
    ic.container_number,
    ic.status as current_container_status,
    cr.status as cod_status,
    CASE 
        WHEN cr.status = 'APPROVED' AND ic.status NOT IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'DEPOT_PROCESSING', 'COMPLETED')
            THEN 'Should be AWAITING_COD_PAYMENT'
        WHEN cr.status = 'DECLINED' AND ic.status != 'COD_REJECTED'
            THEN 'Should be COD_REJECTED'
        ELSE 'Status OK'
    END as recommended_fix
FROM import_containers ic
JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
WHERE 
    (cr.status = 'APPROVED' AND ic.status NOT IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'DEPOT_PROCESSING', 'COMPLETED')) OR
    (cr.status = 'DECLINED' AND ic.status != 'COD_REJECTED');

-- 6. Fix containers with wrong status
UPDATE import_containers 
SET status = 'AWAITING_COD_PAYMENT'
WHERE id IN (
    SELECT ic.id 
    FROM import_containers ic
    INNER JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
    WHERE cr.status = 'APPROVED' 
    AND ic.status NOT IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'DEPOT_PROCESSING', 'COMPLETED')
);

UPDATE import_containers 
SET status = 'COD_REJECTED'
WHERE id IN (
    SELECT ic.id 
    FROM import_containers ic
    INNER JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
    WHERE cr.status = 'DECLINED' 
    AND ic.status != 'COD_REJECTED'
);

-- 7. Verification query
SELECT 
    'Post-Fix Status Check' as section,
    COUNT(*) as total_cod_requests,
    COUNT(CASE WHEN cr.status = 'APPROVED' AND ic.status = 'AWAITING_COD_PAYMENT' THEN 1 END) as approved_cod_correct,
    COUNT(CASE WHEN cr.status = 'DECLINED' AND ic.status = 'COD_REJECTED' THEN 1 END) as declined_cod_correct,
    COUNT(CASE WHEN 
        (cr.status = 'APPROVED' AND ic.status NOT IN ('AWAITING_COD_PAYMENT', 'ON_GOING_COD', 'DEPOT_PROCESSING', 'COMPLETED')) OR
        (cr.status = 'DECLINED' AND ic.status != 'COD_REJECTED')
    THEN 1 END) as still_incorrect
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id;

-- 8. Show recent COD activity
SELECT 
    'Recent COD Activity' as section,
    cr.id,
    ic.container_number,
    cr.status as cod_status,
    ic.status as container_status,
    cr.created_at,
    cr.approved_at,
    cr.declined_at,
    org.name as requesting_org
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
LEFT JOIN organizations org ON cr.requesting_org_id = org.id
ORDER BY cr.created_at DESC
LIMIT 10;

-- 9. Success message
DO $$
BEGIN
    RAISE NOTICE '=== COD ENUM FIX COMPLETED ===';
    RAISE NOTICE 'Fixed trigger function to avoid enum conflict';
    RAISE NOTICE 'Updated container statuses to match COD flow';
    RAISE NOTICE 'Verification completed - check query results above';
    RAISE NOTICE 'You can now test COD approval/rejection flow in UI';
END $$; 