-- Check and Clean Container Data (RUN THIS FIRST)
-- File: check_and_clean_container_data.sql
-- Purpose: Identify and fix data quality issues before adding constraints

-- STEP 1: Check existing data quality
-- First, let's see what invalid data we have
SELECT 
  'INVALID DATA CHECK' as analysis_type,
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
  'DUPLICATE CHECK' as analysis_type,
  container_number,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as record_ids
FROM import_containers 
WHERE container_number IS NOT NULL
GROUP BY container_number 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- STEP 3: Summary statistics
SELECT 
  'SUMMARY' as analysis_type,
  'Total records' as metric,
  COUNT(*)::text as value
FROM import_containers
UNION ALL
SELECT 
  'SUMMARY' as analysis_type,
  'Valid format' as metric,
  COUNT(*)::text as value
FROM import_containers 
WHERE container_number ~ '^[A-Z]{3}[U][0-9]{6}[0-9]$'
UNION ALL
SELECT 
  'SUMMARY' as analysis_type,
  'Invalid format' as metric,
  COUNT(*)::text as value
FROM import_containers 
WHERE container_number !~ '^[A-Z]{3}[U][0-9]{6}[0-9]$' OR container_number IS NULL
UNION ALL
SELECT 
  'SUMMARY' as analysis_type,
  'Unique containers' as metric,
  COUNT(DISTINCT container_number)::text as value
FROM import_containers
UNION ALL
SELECT 
  'SUMMARY' as analysis_type,
  'Duplicate containers' as metric,
  (COUNT(*) - COUNT(DISTINCT container_number))::text as value
FROM import_containers; 