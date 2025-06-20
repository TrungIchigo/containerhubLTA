-- Add Container Number Validation Constraints (SAFE VERSION)
-- File: add_container_validation_constraints.sql
-- Purpose: Ensure container numbers follow ISO 6346 standard at database level

-- STEP 1: Check existing data quality
-- First, let's see what invalid data we have
SELECT 
  container_number,
  LENGTH(container_number) as length,
  CASE 
    WHEN container_number IS NULL THEN 'NULL container number'
    WHEN LENGTH(container_number) != 11 THEN 'Wrong length (should be 11)'
    WHEN container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$' THEN 'Invalid format'
    ELSE 'Valid format'
  END as validation_status,
  id,
  created_at
FROM import_containers 
WHERE container_number IS NULL 
   OR LENGTH(container_number) != 11 
   OR container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$'
ORDER BY created_at DESC;

-- STEP 2: Check for duplicate container numbers
SELECT 
  container_number,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as record_ids
FROM import_containers 
WHERE container_number IS NOT NULL
GROUP BY container_number 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- STEP 3: Clean up invalid data (BACKUP FIRST!)
-- Create a backup table first
CREATE TABLE IF NOT EXISTS import_containers_backup AS 
SELECT * FROM import_containers;

-- Option 3A: Delete invalid records (CAREFUL - this will delete data!)
/*
DELETE FROM import_containers 
WHERE container_number IS NULL 
   OR LENGTH(container_number) != 11 
   OR container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$';
*/

-- Option 3B: Update invalid container numbers to valid format (recommended for development)
-- Generate valid test container numbers for invalid ones
UPDATE import_containers 
SET container_number = 'TEST' || LPAD((ROW_NUMBER() OVER (ORDER BY id))::text, 6, '0') || '0'
WHERE container_number IS NULL 
   OR LENGTH(container_number) != 11 
   OR container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$';

-- STEP 4: Handle duplicates by adding sequence numbers
-- Update duplicates to make them unique
WITH duplicates AS (
  SELECT 
    id,
    container_number,
    ROW_NUMBER() OVER (PARTITION BY container_number ORDER BY created_at) as rn
  FROM import_containers 
  WHERE container_number IS NOT NULL
),
needs_update AS (
  SELECT 
    id,
    container_number,
    SUBSTRING(container_number, 1, 7) || LPAD((rn - 1)::text, 3, '0') || SUBSTRING(container_number, 11, 1) as new_container_number
  FROM duplicates 
  WHERE rn > 1
)
UPDATE import_containers 
SET container_number = needs_update.new_container_number
FROM needs_update 
WHERE import_containers.id = needs_update.id;

-- STEP 5: Verify data is now clean
SELECT 
  'Total records' as check_type,
  COUNT(*) as count
FROM import_containers
UNION ALL
SELECT 
  'Valid format' as check_type,
  COUNT(*) as count
FROM import_containers 
WHERE container_number ~ '^[A-Z]{3}[U][0-9]{6}[0-9]$'
UNION ALL
SELECT 
  'Invalid format' as check_type,
  COUNT(*) as count
FROM import_containers 
WHERE container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$' OR container_number IS NULL
UNION ALL
SELECT 
  'Duplicates' as check_type,
  COUNT(*) - COUNT(DISTINCT container_number) as count
FROM import_containers;

-- STEP 6: Now safely add constraints (only run after data is clean)
-- Add check constraint for container number format
ALTER TABLE import_containers 
ADD CONSTRAINT chk_container_number_format 
CHECK (
  container_number IS NOT NULL 
  AND LENGTH(container_number) = 11 
  AND container_number ~ '^[A-Z]{3}[U][0-9]{6}[0-9]$'
);

-- Add unique constraint to prevent duplicate container numbers
ALTER TABLE import_containers 
ADD CONSTRAINT uq_container_number 
UNIQUE (container_number);

-- STEP 7: Add index for better performance on container number searches
CREATE INDEX IF NOT EXISTS idx_import_containers_container_number 
ON import_containers (container_number);

-- STEP 8: Add comments to explain the constraints
COMMENT ON CONSTRAINT chk_container_number_format ON import_containers IS 
'Validates that container number follows basic ISO 6346 format: 3 letters + U + 6 digits + 1 check digit';

COMMENT ON CONSTRAINT uq_container_number ON import_containers IS 
'Ensures container numbers are unique across the system';

-- STEP 9: Create function to validate check digit (optional enhancement)
CREATE OR REPLACE FUNCTION validate_iso6346_check_digit(container_no TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  letter_values INTEGER[] := ARRAY[
    10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 0, 23, 24,
    25, 26, 27, 28, 29, 30, 31, 32, 0, 34, 35, 36, 37, 38
  ]; -- A-Z values, 0 for skipped values
  sum_val INTEGER := 0;
  calc_digit INTEGER;
  actual_digit INTEGER;
  i INTEGER;
BEGIN
  -- Basic format check
  IF container_no IS NULL OR LENGTH(container_no) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Extract check digit
  actual_digit := SUBSTRING(container_no, 11, 1)::INTEGER;
  
  -- Calculate weighted sum for first 10 characters
  FOR i IN 1..10 LOOP
    IF i <= 4 THEN
      -- Letters: convert to number and multiply by 2^(i-1)
      sum_val := sum_val + letter_values[ASCII(SUBSTRING(container_no, i, 1)) - ASCII('A') + 1] * (2^(i-1));
    ELSE
      -- Digits: multiply by 2^(i-1)
      sum_val := sum_val + SUBSTRING(container_no, i, 1)::INTEGER * (2^(i-1));
    END IF;
  END LOOP;
  
  -- Calculate check digit
  calc_digit := sum_val % 11;
  IF calc_digit = 10 THEN
    calc_digit := 0;
  END IF;
  
  RETURN calc_digit = actual_digit;
END;
$$ LANGUAGE plpgsql;

-- STEP 10: Test the validation function (optional)
-- SELECT container_number, validate_iso6346_check_digit(container_number) as is_valid_check_digit
-- FROM import_containers 
-- LIMIT 10;

-- STEP 11: Final verification query
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'import_containers'::regclass 
  AND conname LIKE '%container%';

-- Add audit function to log validation attempts (optional)
CREATE OR REPLACE FUNCTION log_container_validation_error()
RETURNS TRIGGER AS $$
BEGIN
  -- Log validation errors for monitoring
  INSERT INTO system_logs (
    event_type,
    message,
    created_at
  ) VALUES (
    'CONTAINER_VALIDATION_ERROR',
    'Invalid container number attempted: ' || COALESCE(NEW.container_number, 'NULL'),
    NOW()
  );
  
  RETURN NULL; -- Prevent the insert
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation error logging (if system_logs table exists)
-- DROP TRIGGER IF EXISTS tr_container_validation_error ON import_containers;
-- CREATE TRIGGER tr_container_validation_error
--   BEFORE INSERT OR UPDATE ON import_containers
--   FOR EACH ROW
--   WHEN (NEW.container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$')
--   EXECUTE FUNCTION log_container_validation_error();

-- Example test queries to verify constraints
-- These should fail with constraint violations:

-- INSERT INTO import_containers (container_number, container_type, drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id, status) 
-- VALUES ('INVALID123', '20FT', 'Test Location', NOW(), 'test-org-id', 'test-shipping-id', 'AVAILABLE');

-- INSERT INTO import_containers (container_number, container_type, drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id, status) 
-- VALUES ('ABCD12345678', '20FT', 'Test Location', NOW(), 'test-org-id', 'test-shipping-id', 'AVAILABLE');

-- These should succeed (assuming ISO 6346 check digit is valid):
-- INSERT INTO import_containers (container_number, container_type, drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id, status) 
-- VALUES ('CSQU3054383', '20FT', 'Test Location', NOW(), 'test-org-id', 'test-shipping-id', 'AVAILABLE');

-- Query to check constraint status
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'import_containers'::regclass 
  AND conname LIKE '%container%';

-- Query to verify index creation
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'import_containers' 
  AND indexname LIKE '%container%'; 