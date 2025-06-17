-- Manual fix cho COD request eb32874b-8bb7-4efd-8b06-cc150ad4388d

-- 1. Lấy thông tin depot được request
SELECT 
    d.id as depot_id,
    d.name,
    d.address,
    d.latitude,
    d.longitude
FROM depots d
WHERE d.id = (
    SELECT requested_depot_id 
    FROM cod_requests 
    WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'
);

-- 2. Manual update container với disable RLS tạm thời
BEGIN;

-- Disable RLS tạm thời cho update này
SET row_security = off;

-- Update container
UPDATE import_containers 
SET 
    depot_id = (
        SELECT requested_depot_id 
        FROM cod_requests 
        WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'
    ),
    drop_off_location = (
        SELECT d.name || ', ' || d.address
        FROM depots d
        WHERE d.id = (
            SELECT requested_depot_id 
            FROM cod_requests 
            WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'
        )
    ),
    latitude = (
        SELECT d.latitude
        FROM depots d
        WHERE d.id = (
            SELECT requested_depot_id 
            FROM cod_requests 
            WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'
        )
    ),
    longitude = (
        SELECT d.longitude
        FROM depots d
        WHERE d.id = (
            SELECT requested_depot_id 
            FROM cod_requests 
            WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'
        )
    ),
    status = 'AVAILABLE'
WHERE id = (
    SELECT dropoff_order_id 
    FROM cod_requests 
    WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'
);

-- Re-enable RLS
SET row_security = on;

-- Ghi audit log
INSERT INTO cod_audit_logs (
    request_id,
    actor_user_id,
    actor_org_name,
    action,
    details,
    created_at
) VALUES (
    'eb32874b-8bb7-4efd-8b06-cc150ad4388d',
    NULL,
    'MANUAL_FIX',
    'MANUAL_SYNC',
    jsonb_build_object(
        'reason', 'Manual fix - COD approved but container not updated',
        'fixed_at', NOW(),
        'container_id', (SELECT dropoff_order_id FROM cod_requests WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d')
    ),
    NOW()
);

COMMIT;

-- 3. Verify kết quả
SELECT 
    'After Fix' as check_type,
    cr.status as cod_status,
    ic.status as container_status,
    ic.container_number,
    ic.depot_id,
    ic.drop_off_location,
    ic.latitude,
    ic.longitude
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
WHERE cr.id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'; 