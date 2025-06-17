-- Script để kiểm tra constraints và RLS policies có thể cản trở update

-- 1. Kiểm tra RLS policies trên import_containers
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'import_containers'
ORDER BY tablename, policyname;

-- 2. Kiểm tra constraints trên import_containers
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'import_containers'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. Kiểm tra foreign key constraints trên depot_id
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'import_containers' 
    AND kcu.column_name = 'depot_id'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Kiểm tra triggers trên import_containers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'import_containers'
ORDER BY trigger_name;

-- 5. Kiểm tra current user permissions
SELECT current_user, session_user;

-- 6. Test quyền update trực tiếp với record cụ thể
DO $$
DECLARE
    test_result text;
    container_id uuid;
BEGIN
    -- Lấy container_id từ COD request
    SELECT dropoff_order_id INTO container_id
    FROM cod_requests 
    WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d';
    
    RAISE NOTICE 'Testing update permission for container: %', container_id;
    
    -- Test update với một field nhỏ trước
    BEGIN
        UPDATE import_containers 
        SET updated_at = NOW()
        WHERE id = container_id;
        
        GET DIAGNOSTICS test_result = ROW_COUNT;
        RAISE NOTICE 'Update test successful. Rows affected: %', test_result;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Update test failed with error: %', SQLERRM;
    END;
END $$; 