-- Check current schema of street_turn_requests table
-- Run this in Supabase SQL Editor to see what fields exist

-- 1. Check table schema
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'street_turn_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the new enum types exist
SELECT 
    typname as enum_name, 
    enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('match_type', 'party_approval_status')
ORDER BY typname, enumlabel;

-- 3. Check existing RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'street_turn_requests'
ORDER BY policyname;

-- 4. Check if get_current_org_id function exists
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'get_current_org_id' 
  AND routine_schema = 'public';

-- 5. Sample data check (if any records exist)
SELECT 
    COUNT(*) as total_records,
    COUNT(dropoff_trucking_org_id) as has_dropoff_org,
    COUNT(pickup_trucking_org_id) as has_pickup_org,
    COUNT(match_type) as has_match_type,
    COUNT(dropoff_org_approval_status) as has_approval_status
FROM street_turn_requests; 