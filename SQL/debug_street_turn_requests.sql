-- Debug script for street_turn_requests table
-- Run this to check current schema and data

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

-- 2. Check if enum types exist
SELECT 
    typname, 
    enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('match_type', 'party_approval_status', 'request_status')
ORDER BY typname, enumlabel;

-- 3. Check foreign key constraints
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
  AND tc.table_name='street_turn_requests';

-- 4. Check any existing data
SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
    COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
    COUNT(*) FILTER (WHERE status = 'DECLINED') as declined
FROM street_turn_requests;

-- 5. Show sample records (if any)
SELECT * FROM street_turn_requests LIMIT 5; 