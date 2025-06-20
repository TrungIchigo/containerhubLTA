-- FIX COD REQUESTS RLS POLICY
-- Khắc phục lỗi RLS chặn insert vào bảng cod_requests

-- 1. Kiểm tra RLS policies hiện tại
SELECT 
    'Current RLS Policies for cod_requests' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'cod_requests'
ORDER BY policyname;

-- 2. Xóa policies cũ nếu có
DROP POLICY IF EXISTS "Involved parties can access COD requests" ON public.cod_requests;
DROP POLICY IF EXISTS "Users can access COD requests based on role" ON public.cod_requests;

-- 3. Tạo lại policy đơn giản hơn cho INSERT
-- Policy cho phép dispatcher của organization tạo COD request
CREATE POLICY "Dispatchers can create COD requests" ON public.cod_requests
FOR INSERT WITH CHECK (
    requesting_org_id = public.get_current_org_id()
);

-- 4. Policy cho phép các bên liên quan SELECT
CREATE POLICY "Involved parties can view COD requests" ON public.cod_requests
FOR SELECT USING (
    requesting_org_id = public.get_current_org_id() OR 
    approving_org_id = public.get_current_org_id()
);

-- 5. Policy cho phép carrier admin UPDATE/DELETE
CREATE POLICY "Carrier admin can manage COD requests" ON public.cod_requests
FOR ALL USING (
    approving_org_id = public.get_current_org_id() OR
    requesting_org_id = public.get_current_org_id()
);

-- 6. Kiểm tra lại policies sau khi tạo
SELECT 
    'New RLS Policies for cod_requests' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'cod_requests'
ORDER BY policyname;

-- 7. Test insert thử
DO $$
DECLARE
    test_org_id uuid;
    test_container_id uuid;
    test_depot_id uuid;
    test_result uuid;
BEGIN
    -- Lấy IDs để test
    SELECT organization_id INTO test_org_id FROM profiles LIMIT 1;
    SELECT id INTO test_container_id FROM import_containers WHERE status = 'AVAILABLE' LIMIT 1;
    SELECT id INTO test_depot_id FROM depots LIMIT 1;
    
    RAISE NOTICE 'Testing COD request insert with org_id: %, container_id: %, depot_id: %', 
        test_org_id, test_container_id, test_depot_id;
    
    IF test_org_id IS NOT NULL AND test_container_id IS NOT NULL AND test_depot_id IS NOT NULL THEN
        BEGIN
            -- Test insert
            INSERT INTO cod_requests (
                dropoff_order_id,
                requesting_org_id,
                approving_org_id,
                original_depot_address,
                requested_depot_id,
                reason_for_request,
                status
            ) VALUES (
                test_container_id,
                test_org_id,
                test_org_id, -- Tạm thời dùng cùng org
                'Test depot address',
                test_depot_id,
                'Test RLS policy',
                'PENDING'
            ) RETURNING id INTO test_result;
            
            RAISE NOTICE 'COD request insert test SUCCESS: %', test_result;
            
            -- Cleanup test data
            DELETE FROM cod_requests WHERE id = test_result;
            RAISE NOTICE 'Test data cleaned up';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'COD request insert test FAILED: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Cannot test - missing required data (org: %, container: %, depot: %)', 
            test_org_id IS NOT NULL, test_container_id IS NOT NULL, test_depot_id IS NOT NULL;
    END IF;
END $$;

RAISE NOTICE '✅ COD REQUESTS RLS POLICY FIX COMPLETED'; 