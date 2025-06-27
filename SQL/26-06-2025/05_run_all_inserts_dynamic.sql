-- ============================================================================
-- 05. MASTER SCRIPT - Run All Inserts (Dynamic UUID)
-- Created: 26-06-2025
-- Purpose: Execute all insert scripts in correct order with auto-generated UUIDs
-- ============================================================================

-- Enable output for notices
\set ON_ERROR_STOP on

-- ============================================================================
-- Step 1: Insert Organizations and Profiles
-- ============================================================================
\echo '============================================================================'
\echo 'Step 1: Creating Organizations and User Profiles with Auto-Generated UUIDs'
\echo '============================================================================'

\i 01_organizations_profiles.sql

-- ============================================================================
-- Step 2: Insert Import Containers  
-- ============================================================================
\echo '============================================================================'
\echo 'Step 2: Creating 40 Import Containers'
\echo '============================================================================'

\i 02_import_containers_dynamic.sql

-- ============================================================================
-- Step 3: Insert Export Bookings
-- ============================================================================
\echo '============================================================================'
\echo 'Step 3: Creating 40 Export Bookings'
\echo '============================================================================'

\i 03_export_bookings_dynamic.sql

-- ============================================================================
-- Step 4: Insert Street Turn Requests
-- ============================================================================
\echo '============================================================================'
\echo 'Step 4: Creating 10 Street Turn Requests'
\echo '============================================================================'

\i 04_street_turn_requests_dynamic.sql

-- ============================================================================
-- Data Validation and Summary
-- ============================================================================
\echo '============================================================================'
\echo 'Data Validation and Summary'
\echo '============================================================================'

-- Count records in each table
SELECT 'Organizations with suffix 26062025:' as table_name, count(*) as record_count 
FROM organizations 
WHERE name LIKE '%26062025';

SELECT 'Profiles created:' as table_name, count(*) as record_count 
FROM profiles p
JOIN organizations o ON p.organization_id = o.id 
WHERE o.name LIKE '%26062025';

SELECT 'Import Containers created:' as table_name, count(*) as record_count 
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id 
WHERE o.name LIKE '%26062025';

SELECT 'Export Bookings created:' as table_name, count(*) as record_count 
FROM export_bookings eb
JOIN organizations o ON eb.trucking_company_org_id = o.id 
WHERE o.name LIKE '%26062025';

SELECT 'Street Turn Requests created:' as table_name, count(*) as record_count 
FROM street_turn_requests str
JOIN organizations o ON str.dropoff_trucking_org_id = o.id 
WHERE o.name LIKE '%26062025';

-- ============================================================================
-- Test Case Validation Queries
-- ============================================================================
\echo '============================================================================'
\echo 'Test Case Validation'
\echo '============================================================================'

-- Case 1.1A: Internal Street-turn "Trên Đường" - NEW containers
SELECT 'Case 1.1A - Internal Street-turn containers:' as test_case, count(*) as count
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id
WHERE o.name = 'Công ty Vận tải ABC 26062025'
AND ic.container_number LIKE 'NEWU26060%';

-- Case 1.3: Export bookings created
SELECT 'Case 1.3 - Export bookings created:' as test_case, count(*) as count
FROM export_bookings eb
JOIN organizations o ON eb.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025'
AND eb.booking_number LIKE 'LLRV2406%';

-- Street Turn Requests scenarios  
SELECT 'Street Turn Requests - Linking containers and bookings:' as test_case, count(*) as count
FROM street_turn_requests str
JOIN import_containers ic ON str.import_container_id = ic.id
JOIN export_bookings eb ON str.export_booking_id = eb.id
WHERE ic.container_number LIKE 'NEWU26060%'
AND eb.booking_number LIKE 'LLRV2406%';

-- Container Types validation
SELECT 'Container Types - Unique types used:' as test_case, count(DISTINCT ic.container_type_id) as count
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025'
AND ic.container_number LIKE 'NEWU26060%';

-- ISO 6346 Compliance Check
SELECT 'ISO 6346 Compliance - Valid container numbers:' as test_case, count(*) as count
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025'
AND ic.container_number LIKE 'NEWU26060%'
AND LENGTH(ic.container_number) = 11
AND ic.container_number ~ '^[A-Z]{3}[A-Z][0-9]{6}[0-9]$';

-- Street Turn Request Status Distribution
SELECT 'Street Turn Requests - APPROVED:' as test_case, count(*) as count
FROM street_turn_requests str
JOIN import_containers ic ON str.import_container_id = ic.id
WHERE ic.container_number LIKE 'NEWU26060%'
AND str.status = 'APPROVED';

SELECT 'Street Turn Requests - PENDING:' as test_case, count(*) as count
FROM street_turn_requests str
JOIN import_containers ic ON str.import_container_id = ic.id
WHERE ic.container_number LIKE 'NEWU26060%'
AND str.status = 'PENDING';

-- Match Type Distribution
SELECT 'Street Turn Requests - INTERNAL:' as test_case, count(*) as count
FROM street_turn_requests str
JOIN import_containers ic ON str.import_container_id = ic.id
WHERE ic.container_number LIKE 'NEWU26060%'
AND str.match_type = 'INTERNAL';

SELECT 'Street Turn Requests - MARKETPLACE:' as test_case, count(*) as count
FROM street_turn_requests str
JOIN import_containers ic ON str.import_container_id = ic.id
WHERE ic.container_number LIKE 'NEWU26060%'
AND str.match_type = 'MARKETPLACE';

-- ============================================================================
-- Geographic Distribution
-- ============================================================================
\echo '============================================================================'
\echo 'Geographic Distribution Summary'
\echo '============================================================================'

-- Ho Chi Minh City area containers
SELECT 'Ho Chi Minh City Area:' as location, count(*) as container_count
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025'
AND ic.container_number LIKE 'NEWU26060%'
AND ic.drop_off_location ILIKE '%TP.HCM%';

-- Northern Vietnam containers
SELECT 'Northern Vietnam:' as location, count(*) as container_count
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025'
AND ic.container_number LIKE 'NEWU26060%'
AND (ic.drop_off_location ILIKE '%Hà Nội%' 
     OR ic.drop_off_location ILIKE '%Hải Phòng%'
     OR ic.drop_off_location ILIKE '%Phú Thọ%'
     OR ic.drop_off_location ILIKE '%Hà Nam%'
     OR ic.drop_off_location ILIKE '%Bắc Ninh%'
     OR ic.drop_off_location ILIKE '%Quảng Ninh%'
     OR ic.drop_off_location ILIKE '%Ninh Bình%');

-- Central Vietnam containers
SELECT 'Central Vietnam:' as location, count(*) as container_count
FROM import_containers ic
JOIN organizations o ON ic.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025'
AND ic.container_number LIKE 'NEWU26060%'
AND ic.drop_off_location ILIKE '%Đà Nẵng%';

-- ============================================================================
-- Organization Distribution
-- ============================================================================
\echo '============================================================================'
\echo 'Organization Distribution'
\echo '============================================================================'

-- Distribution by trucking company
SELECT 
    o.name as organization,
    count(CASE WHEN ic.container_number LIKE 'NEWU26060%' THEN ic.id END) as import_containers,
    count(CASE WHEN eb.booking_number LIKE 'LLRV2406%' THEN eb.id END) as export_bookings
FROM organizations o
LEFT JOIN import_containers ic ON ic.trucking_company_org_id = o.id
LEFT JOIN export_bookings eb ON eb.trucking_company_org_id = o.id
WHERE o.name LIKE '%26062025' AND o.type = 'TRUCKING_COMPANY'
GROUP BY o.name;

-- Distribution by shipping line
SELECT 
    o.name as shipping_line,
    count(CASE WHEN ic.container_number LIKE 'NEWU26060%' THEN ic.id END) as import_containers,
    count(CASE WHEN eb.booking_number LIKE 'LLRV2406%' THEN eb.id END) as export_bookings
FROM organizations o
LEFT JOIN import_containers ic ON ic.shipping_line_org_id = o.id
LEFT JOIN export_bookings eb ON eb.shipping_line_org_id = o.id
WHERE o.name LIKE '%26062025' AND o.type = 'SHIPPING_LINE'
GROUP BY o.name;

-- ============================================================================
-- Success Message
-- ============================================================================
\echo '============================================================================'
\echo 'SUCCESS: Test dataset created successfully!'
\echo '============================================================================'
\echo 'Dataset Summary:'
\echo '- 6 Organizations (1 Admin + 2 Trucking + 3 Shipping Lines)'
\echo '- 3 User Profiles'
\echo '- 40 Import Containers (Supply)'
\echo '- 40 Export Bookings (Demand)'
\echo '- 10 Street Turn Requests'
\echo ''
\echo 'Ready for Algorithm V2.0 Testing!'
\echo '============================================================================' 