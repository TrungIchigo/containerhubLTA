-- Simple fix cho COD request eb32874b-8bb7-4efd-8b06-cc150ad4388d
-- Không sử dụng enum MANUAL_SYNC để tránh lỗi

-- 1. Kiểm tra thông tin hiện tại
SELECT 
    'Current Status' as check_type,
    cr.id,
    cr.status as cod_status,
    cr.requested_depot_id,
    ic.id as container_id,
    ic.status as container_status,
    ic.depot_id as current_depot_id,
    ic.drop_off_location
FROM cod_requests cr
JOIN import_containers ic ON cr.dropoff_order_id = ic.id
WHERE cr.id = '7dc869b0-e939-4368-9319-9d946ee9fd2a';

-- 2. Lấy thông tin depot mới
SELECT 
    'New Depot Info' as check_type,
    d.id as depot_id,
    d.name,
    d.address,
    d.latitude,
    d.longitude
FROM depots d
WHERE d.id = (
    SELECT requested_depot_id 
    FROM cod_requests 
    WHERE id = '7dc869b0-e939-4368-9319-9d946ee9fd2a'
);

-- 3. Update container trực tiếp
UPDATE import_containers 
SET 
    depot_id = (
        SELECT requested_depot_id 
        FROM cod_requests 
        WHERE id = '7dc869b0-e939-4368-9319-9d946ee9fd2a'
    ),
    drop_off_location = (
        SELECT d.name || ', ' || d.address
        FROM depots d
        WHERE d.id = (
            SELECT requested_depot_id 
            FROM cod_requests 
            WHERE id = '7dc869b0-e939-4368-9319-9d946ee9fd2a'
        )
    ),
    latitude = (
        SELECT d.latitude
        FROM depots d
        WHERE d.id = (
            SELECT requested_depot_id 
            FROM cod_requests 
            WHERE id = '7dc869b0-e939-4368-9319-9d946ee9fd2a'
        )
    ),
    longitude = (
        SELECT d.longitude
        FROM depots d
        WHERE d.id = (
            SELECT requested_depot_id 
            FROM cod_requests 
            WHERE id = '7dc869b0-e939-4368-9319-9d946ee9fd2a'
        )
    ),
    status = 'AVAILABLE'
WHERE id = (
    SELECT dropoff_order_id 
    FROM cod_requests 
    WHERE id = '7dc869b0-e939-4368-9319-9d946ee9fd2a'
);

-- 4. Verify kết quả
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
WHERE cr.id = '7dc869b0-e939-4368-9319-9d946ee9fd2a'; 