-- Debug RLS context và permissions

-- 1. Kiểm tra current session context
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_role as current_role;

-- 2. Kiểm tra JWT claims (nếu có)
SELECT auth.jwt() as jwt_claims;

-- 3. Kiểm tra current org function
SELECT get_current_org_id() as current_org_id;

-- 4. Kiểm tra container và org relationships cho COD request cụ thể
SELECT 
    ic.id as container_id,
    ic.container_number,
    ic.trucking_company_org_id,
    ic.shipping_line_org_id,
    cr.requesting_org_id,
    cr.approving_org_id,
    get_current_org_id() as current_org_id,
    -- Check permissions
    CASE 
        WHEN ic.trucking_company_org_id = get_current_org_id() THEN 'TRUCKING_OWNER'
        WHEN ic.shipping_line_org_id = get_current_org_id() THEN 'SHIPPING_LINE_OWNER'
        WHEN cr.requesting_org_id = get_current_org_id() THEN 'COD_REQUESTER'
        WHEN cr.approving_org_id = get_current_org_id() THEN 'COD_APPROVER'
        ELSE 'NO_PERMISSION'
    END as permission_type
FROM import_containers ic
JOIN cod_requests cr ON cr.dropoff_order_id = ic.id
WHERE cr.id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d';

-- 5. Test RLS policy evaluation
DO $$
DECLARE
    container_id uuid;
    can_update boolean := false;
BEGIN
    -- Lấy container ID
    SELECT dropoff_order_id INTO container_id
    FROM cod_requests 
    WHERE id = 'eb32874b-8bb7-4efd-8b06-cc150ad4388d';
    
    -- Test if RLS allows update
    BEGIN
        PERFORM 1 
        FROM import_containers 
        WHERE id = container_id 
        FOR UPDATE;
        
        can_update := true;
        RAISE NOTICE 'RLS allows UPDATE on container: %', container_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'RLS blocks UPDATE on container: %, Error: %', container_id, SQLERRM;
    END;
    
    RAISE NOTICE 'Can update container: %', can_update;
END $$; 