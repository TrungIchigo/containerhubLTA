-- =====================================================
-- DEBUG: Kiểm tra Schema và Relationships
-- =====================================================

-- 1. Kiểm tra bảng gpg_depots có tồn tại không
SELECT 
    schemaname, 
    tablename, 
    tableowner
FROM pg_tables 
WHERE tablename IN ('gpg_depots', 'cod_requests', 'depots');

-- 2. Kiểm tra cấu trúc bảng cod_requests
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cod_requests' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Kiểm tra foreign key constraints của cod_requests
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'cod_requests';

-- 4. Kiểm tra bảng gpg_depots có dữ liệu không
SELECT COUNT(*) as gpg_depots_count FROM gpg_depots;

-- 5. Kiểm tra bảng depots có dữ liệu không  
SELECT COUNT(*) as depots_count FROM depots;

-- 6. Kiểm tra cod_requests có record nào với status PENDING_PAYMENT không
SELECT 
    id,
    status,
    cod_fee,
    delivery_confirmed_at,
    requested_depot_id,
    created_at
FROM cod_requests 
WHERE status = 'PENDING_PAYMENT'
ORDER BY created_at DESC
LIMIT 5;

-- 7. Kiểm tra tất cả cod_requests
SELECT 
    id,
    status,
    cod_fee,
    requested_depot_id,
    created_at
FROM cod_requests 
ORDER BY created_at DESC
LIMIT 10; 