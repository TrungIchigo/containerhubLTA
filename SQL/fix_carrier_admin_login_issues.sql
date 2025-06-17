-- Fix Carrier Admin Login Issues
-- This script addresses foreign key relationship errors and schema issues

-- 1. Check and fix foreign key constraints on street_turn_requests table
DO $$
BEGIN
    -- Drop existing foreign key constraints that might be problematic
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'street_turn_requests_approving_org_id_fkey' 
        AND table_name = 'street_turn_requests'
    ) THEN
        ALTER TABLE street_turn_requests DROP CONSTRAINT street_turn_requests_approving_org_id_fkey;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'street_turn_requests_dropoff_trucking_org_id_fkey' 
        AND table_name = 'street_turn_requests'
    ) THEN
        ALTER TABLE street_turn_requests DROP CONSTRAINT street_turn_requests_dropoff_trucking_org_id_fkey;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'street_turn_requests_pickup_trucking_org_id_fkey' 
        AND table_name = 'street_turn_requests'
    ) THEN
        ALTER TABLE street_turn_requests DROP CONSTRAINT street_turn_requests_pickup_trucking_org_id_fkey;
    END IF;
END $$;

-- 2. Re-create proper foreign key constraints
ALTER TABLE street_turn_requests 
ADD CONSTRAINT street_turn_requests_approving_org_id_fkey 
FOREIGN KEY (approving_org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE street_turn_requests 
ADD CONSTRAINT street_turn_requests_dropoff_trucking_org_id_fkey 
FOREIGN KEY (dropoff_trucking_org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE street_turn_requests 
ADD CONSTRAINT street_turn_requests_pickup_trucking_org_id_fkey 
FOREIGN KEY (pickup_trucking_org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Ensure import_containers foreign key is correct
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'import_containers_trucking_company_org_id_fkey' 
        AND table_name = 'import_containers'
    ) THEN
        ALTER TABLE import_containers DROP CONSTRAINT import_containers_trucking_company_org_id_fkey;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'import_containers_shipping_line_org_id_fkey' 
        AND table_name = 'import_containers'
    ) THEN
        ALTER TABLE import_containers DROP CONSTRAINT import_containers_shipping_line_org_id_fkey;
    END IF;
END $$;

ALTER TABLE import_containers 
ADD CONSTRAINT import_containers_trucking_company_org_id_fkey 
FOREIGN KEY (trucking_company_org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE import_containers 
ADD CONSTRAINT import_containers_shipping_line_org_id_fkey 
FOREIGN KEY (shipping_line_org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 4. Ensure export_bookings foreign key is correct
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'export_bookings_trucking_company_org_id_fkey' 
        AND table_name = 'export_bookings'
    ) THEN
        ALTER TABLE export_bookings DROP CONSTRAINT export_bookings_trucking_company_org_id_fkey;
    END IF;
END $$;

ALTER TABLE export_bookings 
ADD CONSTRAINT export_bookings_trucking_company_org_id_fkey 
FOREIGN KEY (trucking_company_org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 5. Check and ensure all carrier admin organizations exist
-- Insert sample carrier admin organization if none exists
INSERT INTO organizations (id, name, type, address, phone, email, status)
SELECT 
    gen_random_uuid(),
    'Hapag-Lloyd Vietnam',
    'SHIPPING_LINE',
    '123 Nguyen Hue, District 1, Ho Chi Minh City',
    '+84-28-1234-5678',
    'admin@hapag-lloyd.vn',
    'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM organizations WHERE type = 'SHIPPING_LINE' AND status = 'ACTIVE'
);

-- 6. Create a sample carrier admin user if none exists
DO $$
DECLARE
    shipping_line_id uuid;
    sample_user_id uuid := 'a1b2c3d4-e5f6-7890-abcd-123456789012'; -- Fixed UUID for testing
BEGIN
    -- Get a shipping line organization
    SELECT id INTO shipping_line_id 
    FROM organizations 
    WHERE type = 'SHIPPING_LINE' AND status = 'ACTIVE' 
    LIMIT 1;
    
    IF shipping_line_id IS NOT NULL THEN
        -- Create sample carrier admin profile
        INSERT INTO profiles (id, full_name, organization_id, role)
        VALUES (
            sample_user_id,
            'Admin Lloyd Vietnam',
            shipping_line_id,
            'CARRIER_ADMIN'
        )
        ON CONFLICT (id) DO UPDATE SET
            organization_id = shipping_line_id,
            role = 'CARRIER_ADMIN';
    END IF;
END $$;

-- 7. Fix any data inconsistencies
-- Remove street_turn_requests with invalid foreign keys
DELETE FROM street_turn_requests 
WHERE approving_org_id NOT IN (SELECT id FROM organizations)
   OR dropoff_trucking_org_id NOT IN (SELECT id FROM organizations)
   OR pickup_trucking_org_id NOT IN (SELECT id FROM organizations);

-- Remove import_containers with invalid foreign keys
DELETE FROM import_containers 
WHERE trucking_company_org_id NOT IN (SELECT id FROM organizations)
   OR shipping_line_org_id NOT IN (SELECT id FROM organizations);

-- Remove export_bookings with invalid foreign keys
DELETE FROM export_bookings 
WHERE trucking_company_org_id NOT IN (SELECT id FROM organizations);

-- 8. Update RLS policies to ensure proper access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view street_turn_requests for their organization" ON street_turn_requests;
DROP POLICY IF EXISTS "Users can create street_turn_requests" ON street_turn_requests;
DROP POLICY IF EXISTS "Users can update street_turn_requests for their organization" ON street_turn_requests;

-- Create new RLS policies for street_turn_requests
CREATE POLICY "Users can view street_turn_requests for their organization" ON street_turn_requests
    FOR SELECT USING (
        approving_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR dropoff_trucking_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR pickup_trucking_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can create street_turn_requests" ON street_turn_requests
    FOR INSERT WITH CHECK (
        dropoff_trucking_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        OR pickup_trucking_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Carrier admins can update street_turn_requests" ON street_turn_requests
    FOR UPDATE USING (
        approving_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
        AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'CARRIER_ADMIN'
    );

-- 9. Grant proper permissions
GRANT ALL ON street_turn_requests TO authenticated;
GRANT ALL ON import_containers TO authenticated;
GRANT ALL ON export_bookings TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- 10. Verify the fixes
SELECT 'Foreign Key Constraints Check' as check_type,
       tc.constraint_name,
       tc.table_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('street_turn_requests', 'import_containers', 'export_bookings')
ORDER BY tc.table_name, tc.constraint_name;

-- Show carrier admin organizations
SELECT 'Carrier Admin Organizations' as check_type,
       o.id, o.name, o.type, o.status,
       COUNT(p.id) as admin_count
FROM organizations o
LEFT JOIN profiles p ON o.id = p.organization_id AND p.role = 'CARRIER_ADMIN'
WHERE o.type = 'SHIPPING_LINE'
GROUP BY o.id, o.name, o.type, o.status
ORDER BY o.name;

COMMIT; 