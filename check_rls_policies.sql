-- Kiểm tra RLS policies trên bảng quan trọng

-- 1. Kiểm tra RLS được enable không
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('import_containers', 'cod_requests', 'cod_audit_logs')
ORDER BY tablename;

-- 2. Kiểm tra policies trên import_containers
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'import_containers'
ORDER BY policyname;

-- 3. Kiểm tra policies trên cod_requests
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'cod_requests'
ORDER BY policyname;

-- 4. Test quyền update trực tiếp với một container
DO $$
DECLARE
    test_container_id uuid;
    test_result text;
BEGIN
    -- Lấy một container ID bất kỳ để test
    SELECT id INTO test_container_id 
    FROM import_containers 
    LIMIT 1;
    
    RAISE NOTICE 'Testing update on container: %', test_container_id;
    
    BEGIN
        -- Test update một field đơn giản
        UPDATE import_containers 
        SET updated_at = NOW() 
        WHERE id = test_container_id;
        
        GET DIAGNOSTICS test_result = ROW_COUNT;
        RAISE NOTICE 'Update test result: % rows affected', test_result;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Update failed with error: %', SQLERRM;
    END;
END $$; 