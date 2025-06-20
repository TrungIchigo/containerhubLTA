-- Debug script for carrier admin issue
-- Run this in Supabase SQL Editor to check data

-- 1. Check organizations
SELECT 'Organizations' as check_type, * FROM organizations ORDER BY type, name;

-- 2. Check profiles
SELECT 'Profiles' as check_type, 
       p.id, 
       p.full_name, 
       p.role, 
       o.name as organization_name,
       o.type as organization_type
FROM profiles p 
LEFT JOIN organizations o ON p.organization_id = o.id
ORDER BY p.role, o.name;

-- 3. Check import containers
SELECT 'Import Containers' as check_type,
       ic.container_number,
       ic.container_type,
       tc.name as trucking_company,
       sl.name as shipping_line,
       ic.status
FROM import_containers ic
LEFT JOIN organizations tc ON ic.trucking_company_org_id = tc.id
LEFT JOIN organizations sl ON ic.shipping_line_org_id = sl.id
ORDER BY ic.created_at DESC;

-- 4. Check export bookings  
SELECT 'Export Bookings' as check_type,
       eb.booking_number,
       eb.required_container_type,
       tc.name as trucking_company,
       eb.status
FROM export_bookings eb
LEFT JOIN organizations tc ON eb.trucking_company_org_id = tc.id
ORDER BY eb.created_at DESC;

-- 5. Check street turn requests
SELECT 'Street Turn Requests' as check_type,
       str.id,
       str.status,
       str.created_at,
       req_org.name as requesting_org,
       app_org.name as approving_org,
       ic.container_number,
       eb.booking_number
FROM street_turn_requests str
LEFT JOIN organizations req_org ON str.requesting_org_id = req_org.id
LEFT JOIN organizations app_org ON str.approving_org_id = app_org.id
LEFT JOIN import_containers ic ON str.import_container_id = ic.id
LEFT JOIN export_bookings eb ON str.export_booking_id = eb.id
ORDER BY str.created_at DESC;

-- 6. Check current user function (if logged in)
SELECT 'Current User' as check_type, auth.uid() as user_id;

-- 7. Check get_current_org_id function
SELECT 'Current Org ID' as check_type, public.get_current_org_id() as org_id; 