-- Kiểm tra chi tiết RLS policies trên import_containers

-- 1. Kiểm tra RLS có được enable không
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'import_containers';

-- 2. Kiểm tra tất cả policies trên import_containers
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

-- 3. Kiểm tra function get_current_org_id có hoạt động không
SELECT get_current_org_id() as current_org_id;

-- 4. Test quyền update trực tiếp trên container với COD request đã fix
DO $$
DECLARE
    test_container_id uuid;
    test_result text;
    user_org_id uuid;
BEGIN
    -- Lấy container từ COD request đã fix
    SELECT dropoff_order_id INTO test_container_id
    FROM cod_requests 
    WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d';
    
    -- Lấy current org id
    SELECT get_current_org_id() INTO user_org_id;
    
    RAISE NOTICE 'Testing update on container: %, Current org: %', test_container_id, user_org_id;
    
    BEGIN
        -- Test update một field đơn giản
        UPDATE import_containers 
        SET updated_at = NOW() 
        WHERE id = test_container_id;
        
        GET DIAGNOSTICS test_result = ROW_COUNT;
        RAISE NOTICE 'Update test result: % rows affected', test_result;
        
        IF test_result::integer = 0 THEN
            RAISE NOTICE 'Update failed - likely blocked by RLS policy';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Update failed with error: %', SQLERRM;
    END;
END $$; 