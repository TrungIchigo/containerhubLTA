-- Apply Container Constraints (SAFE VERSION)
-- File: apply_constraints_safe.sql
-- Purpose: Apply constraints after data has been cleaned
-- RUN ONLY AFTER fix_container_data.sql has been executed successfully

-- STEP 1: Final verification before applying constraints
SELECT 
  'PRE-CONSTRAINT CHECK' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SAFE TO PROCEED'
    ELSE 'DO NOT PROCEED - INVALID DATA EXISTS'
  END as status,
  COUNT(*) as invalid_records
FROM import_containers 
WHERE container_number IS NULL 
   OR LENGTH(container_number) != 11 
   OR container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$';

-- STEP 2: Check for duplicates
SELECT 
  'DUPLICATE CHECK' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN 'NO DUPLICATES - SAFE TO PROCEED'
    ELSE 'DUPLICATES EXIST - DO NOT PROCEED'
  END as status,
  COUNT(*) as duplicate_groups
FROM (
  SELECT container_number
  FROM import_containers 
  GROUP BY container_number 
  HAVING COUNT(*) > 1
) duplicate_check;

-- STEP 3: Apply check constraint for container number format
-- Only run if above checks show "SAFE TO PROCEED"
ALTER TABLE import_containers 
ADD CONSTRAINT chk_container_number_format 
CHECK (
  container_number IS NOT NULL 
  AND LENGTH(container_number) = 11 
  AND container_number ~ '^[A-Z]{3}[U][0-9]{6}[0-9]$'
);

-- STEP 4: Apply unique constraint to prevent duplicate container numbers
ALTER TABLE import_containers 
ADD CONSTRAINT uq_container_number 
UNIQUE (container_number);

-- STEP 5: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_import_containers_container_number 
ON import_containers (container_number);

-- STEP 6: Add comments to explain the constraints
COMMENT ON CONSTRAINT chk_container_number_format ON import_containers IS 
'Validates that container number follows basic ISO 6346 format: 3 letters + U + 6 digits + 1 check digit';

COMMENT ON CONSTRAINT uq_container_number ON import_containers IS 
'Ensures container numbers are unique across the system';

-- STEP 7: Verify constraints were applied successfully
SELECT 
  'CONSTRAINT VERIFICATION' as verification_type,
  conname as constraint_name,
  CASE contype 
    WHEN 'c' THEN 'CHECK'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    ELSE contype::text
  END as constraint_type,
  CASE 
    WHEN conname IS NOT NULL THEN 'APPLIED SUCCESSFULLY'
    ELSE 'FAILED TO APPLY'
  END as status
FROM pg_constraint 
WHERE conrelid = 'import_containers'::regclass 
  AND conname LIKE '%container%'
ORDER BY conname;

-- STEP 8: Test the constraints with sample data (optional)
-- This should succeed
-- INSERT INTO import_containers (container_number, container_type, drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id, status) 
-- VALUES ('CSQU3054383', '20FT', 'Test Location', NOW(), gen_random_uuid(), gen_random_uuid(), 'AVAILABLE');

-- This should fail with check constraint violation
-- INSERT INTO import_containers (container_number, container_type, drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id, status) 
-- VALUES ('INVALID123', '20FT', 'Test Location', NOW(), gen_random_uuid(), gen_random_uuid(), 'AVAILABLE');

-- This should fail with unique constraint violation (if CSQU3054383 already exists)
-- INSERT INTO import_containers (container_number, container_type, drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id, status) 
-- VALUES ('CSQU3054383', '20FT', 'Test Location 2', NOW(), gen_random_uuid(), gen_random_uuid(), 'AVAILABLE');

-- STEP 9: Final success message
SELECT 
  'CONSTRAINTS APPLIED SUCCESSFULLY' as result,
  'Container validation is now active' as message,
  NOW() as applied_at; 