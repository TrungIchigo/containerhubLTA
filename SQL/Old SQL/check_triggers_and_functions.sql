-- Check triggers and functions that might be using old field names
-- Run this in Supabase SQL Editor

-- 1. Check all triggers on street_turn_requests table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'street_turn_requests'
  AND event_object_schema = 'public';

-- 2. Check all functions that mention requesting_org_id
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%requesting_org_id%';

-- 3. Check stored procedures/functions for street_turn_requests
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND prosrc ILIKE '%street_turn_requests%'
  AND prosrc ILIKE '%requesting_org_id%';

-- 4. Check views that might be using old field
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition ILIKE '%requesting_org_id%';

-- 5. Check if auto_approval function exists and uses old fields
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_auto_approval';

-- 6. Check current trigger status
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'street_turn_requests'; 