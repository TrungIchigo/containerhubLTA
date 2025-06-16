-- Fix Container Data (RUN AFTER checking data)
-- File: fix_container_data.sql
-- Purpose: Clean up invalid container data before adding constraints

-- STEP 1: Create backup table first (IMPORTANT!)
CREATE TABLE IF NOT EXISTS import_containers_backup AS 
SELECT * FROM import_containers;

-- Verify backup was created
SELECT 'Backup created' as status, COUNT(*) as records_backed_up 
FROM import_containers_backup;

-- STEP 2: Fix invalid container numbers
-- Generate valid test container numbers for invalid ones
UPDATE import_containers 
SET container_number = 'TESU' || LPAD((ROW_NUMBER() OVER (ORDER BY id))::text, 6, '0') || '0'
WHERE container_number IS NULL 
   OR LENGTH(container_number) != 11 
   OR container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$';

-- Show how many records were updated
SELECT 'Invalid format fixed' as status, COUNT(*) as records_updated
FROM import_containers 
WHERE container_number LIKE 'TESU%';

-- STEP 3: Handle duplicates by adding sequence numbers
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
    SUBSTRING(container_number, 1, 4) || LPAD(((SUBSTRING(container_number, 5, 6)::INTEGER) + rn - 1)::text, 6, '0') || SUBSTRING(container_number, 11, 1) as new_container_number
  FROM duplicates 
  WHERE rn > 1
)
UPDATE import_containers 
SET container_number = needs_update.new_container_number
FROM needs_update 
WHERE import_containers.id = needs_update.id;

-- STEP 4: Verify data is now clean
SELECT 
  'VERIFICATION' as check_type,
  'Total records' as metric,
  COUNT(*)::text as count
FROM import_containers
UNION ALL
SELECT 
  'VERIFICATION' as check_type,
  'Valid format' as metric,
  COUNT(*)::text as count
FROM import_containers 
WHERE container_number ~ '^[A-Z]{3}[U][0-9]{6}[0-9]$'
UNION ALL
SELECT 
  'VERIFICATION' as check_type,
  'Invalid format' as metric,
  COUNT(*)::text as count
FROM import_containers 
WHERE container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$' OR container_number IS NULL
UNION ALL
SELECT 
  'VERIFICATION' as check_type,
  'Unique containers' as metric,
  COUNT(DISTINCT container_number)::text as count
FROM import_containers
UNION ALL
SELECT 
  'VERIFICATION' as check_type,
  'Duplicates' as metric,
  (COUNT(*) - COUNT(DISTINCT container_number))::text as count
FROM import_containers;

-- STEP 5: Show final status
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'READY FOR CONSTRAINTS' 
    ELSE 'STILL HAVE ISSUES'
  END as final_status,
  COUNT(*) as remaining_invalid_records
FROM import_containers 
WHERE container_number IS NULL 
   OR LENGTH(container_number) != 11 
   OR container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$';

-- STEP 6: Check for any remaining duplicates
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'NO DUPLICATES'
    ELSE 'DUPLICATES STILL EXIST'
  END as duplicate_status,
  COUNT(*) as duplicate_groups
FROM (
  SELECT container_number
  FROM import_containers 
  GROUP BY container_number 
  HAVING COUNT(*) > 1
) duplicate_check; 