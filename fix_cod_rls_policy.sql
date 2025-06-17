-- Fix RLS policy để cho phép carrier admin update containers trong COD flow

-- 1. Tạo policy cho carrier admin có thể update containers có COD request
CREATE POLICY "Carrier admin can update containers via COD approval" 
ON public.import_containers
FOR UPDATE
TO authenticated
USING (
  -- Cho phép carrier admin update container nếu:
  -- 1. Có COD request pending/awaiting_info cho container này
  -- 2. User thuộc org được approve (approving_org_id)
  EXISTS (
    SELECT 1 
    FROM cod_requests cr
    WHERE cr.dropoff_order_id = import_containers.id
      AND cr.status IN ('PENDING', 'AWAITING_INFO', 'APPROVED') 
      AND cr.approving_org_id = get_current_org_id()
  )
  OR
  -- Hoặc user thuộc org sở hữu container (fallback cho các case khác)
  trucking_company_org_id = get_current_org_id()
  OR 
  shipping_line_org_id = get_current_org_id()
);

-- 2. Tạo policy cho dispatcher có thể update containers của org mình
CREATE POLICY "Dispatcher can update own org containers" 
ON public.import_containers
FOR UPDATE
TO authenticated
USING (
  trucking_company_org_id = get_current_org_id()
);

-- 3. Nếu cần, tạo temporary policy để bypass RLS cho service operations
CREATE POLICY "Service operations can update containers" 
ON public.import_containers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Kiểm tra các policies hiện tại
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'import_containers'
ORDER BY policyname;

-- 5. Test update với policy mới
DO $$
DECLARE
    test_container_id uuid;
    test_result text;
BEGIN
    -- Lấy container từ COD request
    SELECT dropoff_order_id INTO test_container_id
    FROM cod_requests 
    WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d';
    
    RAISE NOTICE 'Testing update with new policy on container: %', test_container_id;
    
    BEGIN
        UPDATE import_containers 
        SET updated_at = NOW() 
        WHERE id = test_container_id;
        
        GET DIAGNOSTICS test_result = ROW_COUNT;
        RAISE NOTICE 'Update result: % rows affected', test_result;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Update failed: %', SQLERRM;
    END;
END $$; 