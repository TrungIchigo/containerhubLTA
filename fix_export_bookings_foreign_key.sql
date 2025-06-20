-- Fix export_bookings foreign key relationship issues
-- This script diagnoses and fixes the foreign key problems

-- 1. First, let's check the current state of the table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'export_bookings' 
AND column_name = 'shipping_line_org_id';

-- 2. Check existing foreign key constraints
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
AND tc.table_name = 'export_bookings';

-- 3. Drop the problematic foreign key constraint if it exists (with various possible names)
DO $$ 
BEGIN
  -- Try different possible constraint names
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'fk_export_bookings_shipping_line_org_id' 
             AND table_name = 'export_bookings') THEN
    ALTER TABLE export_bookings DROP CONSTRAINT fk_export_bookings_shipping_line_org_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'export_bookings_shipping_line_org_id_fkey' 
             AND table_name = 'export_bookings') THEN
    ALTER TABLE export_bookings DROP CONSTRAINT export_bookings_shipping_line_org_id_fkey;
  END IF;
END $$;

-- 4. Make sure the column allows NULL temporarily (for fixing existing data)
ALTER TABLE export_bookings ALTER COLUMN shipping_line_org_id DROP NOT NULL;

-- 5. Clean up any invalid data (set invalid shipping_line_org_id to NULL)
UPDATE export_bookings 
SET shipping_line_org_id = NULL 
WHERE shipping_line_org_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM organizations 
  WHERE id = export_bookings.shipping_line_org_id 
  AND type = 'SHIPPING_LINE'
);

-- 6. Recreate the foreign key constraint with the correct name
ALTER TABLE export_bookings 
ADD CONSTRAINT export_bookings_shipping_line_org_id_fkey 
FOREIGN KEY (shipping_line_org_id) 
REFERENCES organizations(id) ON DELETE SET NULL;

-- 7. Create index for better performance
DROP INDEX IF EXISTS idx_export_bookings_shipping_line_org_id;
CREATE INDEX idx_export_bookings_shipping_line_org_id 
ON export_bookings(shipping_line_org_id);

-- 8. Update the dispatcher action query to use a simpler approach
-- Instead of relying on the foreign key name, we'll update the code to use a different approach

-- 9. Verify the constraint was created correctly
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

-- 10. Test the relationship works
SELECT 
  eb.id,
  eb.booking_number,
  eb.shipping_line_org_id,
  org.name as shipping_line_name,
  org.type
FROM export_bookings eb
LEFT JOIN organizations org ON eb.shipping_line_org_id = org.id
LIMIT 5; 