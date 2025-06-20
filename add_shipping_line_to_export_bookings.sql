-- Add shipping_line_org_id to export_bookings table
-- This script adds the shipping line organization field to export bookings

-- 1. Add the new column
ALTER TABLE export_bookings 
ADD COLUMN IF NOT EXISTS shipping_line_org_id UUID;

-- 2. Add foreign key constraint
ALTER TABLE export_bookings 
ADD CONSTRAINT fk_export_bookings_shipping_line_org_id 
FOREIGN KEY (shipping_line_org_id) 
REFERENCES organizations(id) ON DELETE SET NULL;

-- 3. Create a trigger function to validate shipping line type
CREATE OR REPLACE FUNCTION validate_shipping_line_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if shipping_line_org_id is provided and is actually a shipping line
  IF NEW.shipping_line_org_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM organizations 
      WHERE id = NEW.shipping_line_org_id 
      AND type = 'SHIPPING_LINE'
    ) THEN
      RAISE EXCEPTION 'shipping_line_org_id must reference an organization of type SHIPPING_LINE';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to validate shipping line type on insert/update
DROP TRIGGER IF EXISTS validate_export_booking_shipping_line ON export_bookings;
CREATE TRIGGER validate_export_booking_shipping_line
  BEFORE INSERT OR UPDATE ON export_bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_shipping_line_type();

-- 5. Update existing records to set a default shipping line (optional)
-- This is only needed if you have existing data and want to set a default value
-- Replace 'DEFAULT_SHIPPING_LINE_ID' with an actual shipping line organization ID

-- UPDATE export_bookings 
SET shipping_line_org_id = 'DEFAULT_SHIPPING_LINE_ID'
WHERE shipping_line_org_id IS NULL;

-- 6. If you want to make the field required, uncomment the line below
ALTER TABLE export_bookings 
ALTER COLUMN shipping_line_org_id SET NOT NULL;

-- 7. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_export_bookings_shipping_line_org_id 
ON export_bookings(shipping_line_org_id);

-- 8. Update RLS policies if needed
-- Drop existing policies that might need updating
DROP POLICY IF EXISTS "export_bookings_select_policy" ON export_bookings;
DROP POLICY IF EXISTS "export_bookings_insert_policy" ON export_bookings;
DROP POLICY IF EXISTS "export_bookings_update_policy" ON export_bookings;
DROP POLICY IF EXISTS "export_bookings_delete_policy" ON export_bookings;

-- Recreate RLS policies with shipping line access
CREATE POLICY "export_bookings_select_policy" ON export_bookings
FOR SELECT USING (
  -- Trucking companies can see their own bookings
  trucking_company_org_id = (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Shipping lines can see bookings assigned to them
  shipping_line_org_id = (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "export_bookings_insert_policy" ON export_bookings
FOR INSERT WITH CHECK (
  -- Only dispatchers can create bookings
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'DISPATCHER'
  )
  AND
  -- Must be for their own organization
  trucking_company_org_id = (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "export_bookings_update_policy" ON export_bookings
FOR UPDATE USING (
  -- Trucking companies can update their own bookings
  trucking_company_org_id = (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Shipping lines can update status of bookings assigned to them
  (
    shipping_line_org_id = (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'CARRIER_ADMIN'
    )
  )
);

CREATE POLICY "export_bookings_delete_policy" ON export_bookings
FOR DELETE USING (
  -- Only trucking companies can delete their own bookings
  trucking_company_org_id = (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid()
  )
  AND
  -- Only dispatchers can delete
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'DISPATCHER'
  )
);

-- 9. Update any views that might need the new field
-- If you have views based on export_bookings, you may need to recreate them

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON export_bookings TO authenticated;

-- 11. Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'export_bookings' 
AND column_name = 'shipping_line_org_id';

-- Show foreign key constraints
SELECT 
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
AND tc.table_name = 'export_bookings'
AND kcu.column_name = 'shipping_line_org_id'; 