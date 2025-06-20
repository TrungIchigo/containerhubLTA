-- Fix containers to be listed on marketplace
UPDATE import_containers 
SET is_listed_on_marketplace = true 
WHERE trucking_company_org_id IN (
    SELECT id 
    FROM organizations 
    WHERE name LIKE 'Công ty Vận tải%' 
    OR name LIKE '%ABC%' 
    OR name LIKE '%XYZ%' 
    OR name LIKE '%DEF%' 
    OR name LIKE '%GHI%' 
    OR name LIKE '%JKL%'
);

-- Verify the update
SELECT 
    ic.container_number,
    ic.container_type,
    ic.is_listed_on_marketplace,
    tc.name as trucking_company
FROM import_containers ic
JOIN organizations tc ON ic.trucking_company_org_id = tc.id
WHERE ic.is_listed_on_marketplace = true
ORDER BY ic.created_at DESC; 