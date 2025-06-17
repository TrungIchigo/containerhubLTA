-- Script để kiểm tra và sửa COD request eb32874b-8bb7-4efd-8b06-cc150ad4388d

-- 1. Kiểm tra trạng thái hiện tại của COD request
SELECT 
    'COD Request Status' as check_type,
    cr.id,
    cr.status,
    cr.dropoff_order_id,
    cr.requested_depot_id,
    cr.created_at,
    cr.updated_at
FROM cod_requests cr 
WHERE cr.id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d';

-- 2. Kiểm tra trạng thái container tương ứng
SELECT 
    'Container Status' as check_type,
    ic.id,
    ic.container_number,
    ic.status,
    ic.depot_id,
    ic.drop_off_location,
    ic.latitude,
    ic.longitude
FROM import_containers ic
WHERE ic.id = (
    SELECT dropoff_order_id 
    FROM cod_requests 
    WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'
);

-- 3. Lấy thông tin depot được request
SELECT 
    'Requested Depot Info' as check_type,
    d.id,
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

-- 4. Nếu COD request đã APPROVED nhưng container chưa update, thực hiện update
DO $$
DECLARE
    cod_status text;
    container_status text;
    dropoff_id uuid;
    new_depot_id uuid;
    depot_name text;
    depot_address text;
    depot_lat numeric;
    depot_lng numeric;
BEGIN
    -- Lấy thông tin COD request
    SELECT status, dropoff_order_id, requested_depot_id
    INTO cod_status, dropoff_id, new_depot_id
    FROM cod_requests 
    WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d';
    
    -- Lấy status container hiện tại
    SELECT status 
    INTO container_status
    FROM import_containers 
    WHERE id = dropoff_id;
    
    -- Lấy thông tin depot
    SELECT name, address, latitude, longitude
    INTO depot_name, depot_address, depot_lat, depot_lng
    FROM depots 
    WHERE id = new_depot_id;
    
    RAISE NOTICE 'COD Status: %, Container Status: %', cod_status, container_status;
    
    -- Nếu COD đã APPROVED nhưng container vẫn AWAITING_COD_APPROVAL
    IF cod_status = 'APPROVED' AND container_status = 'AWAITING_COD_APPROVAL' THEN
        RAISE NOTICE 'Found inconsistency! Updating container...';
        
        -- Update container với thông tin depot mới
        UPDATE import_containers 
        SET 
            depot_id = new_depot_id,
            drop_off_location = depot_name || ', ' || depot_address,
            latitude = depot_lat,
            longitude = depot_lng,
            status = 'AVAILABLE'
        WHERE id = dropoff_id;
        
        RAISE NOTICE 'Container updated successfully!';
        
        -- Log action trong audit
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
            'SYSTEM_FIX',
            'MANUAL_SYNC',
            jsonb_build_object(
                'reason', 'Manual sync after approval inconsistency',
                'depot_name', depot_name,
                'depot_address', depot_address
            ),
            NOW()
        );
        
    ELSE
        RAISE NOTICE 'No inconsistency found or container already synced';
    END IF;
END $$;

-- 5. Kiểm tra kết quả sau khi fix
SELECT 
    'Final Status Check' as check_type,
    cr.status as cod_status,
    ic.status as container_status,
    ic.container_number,
    ic.depot_id,
    ic.drop_off_location
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
WHERE cr.id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d'; 