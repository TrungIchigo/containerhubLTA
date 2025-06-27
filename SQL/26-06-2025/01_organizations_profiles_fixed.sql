-- ============================================================================
-- 01. ORGANIZATIONS & PROFILES SETUP (FIXED PASSWORDS)
-- Created: 26-06-2025
-- Purpose: Create base organizations and user profiles with working passwords
-- ============================================================================

-- First, let's create a script to fix the existing users' passwords
-- Password will be 'password123' for all test accounts

-- Update existing test users with proper password hash
UPDATE auth.users 
SET encrypted_password = '$2a$10$N9qo8uLOickgx2ZMRZoMye/oRHy22DnRXHVhsAH2M8KGPPPBYdN6m'
WHERE email IN (
    'lta.admin.26062025@test.com',
    'dispatcher.abc.26062025@test.com', 
    'test01.dispatcher.26062025@test.com'
);

-- Verify the users exist and profiles are linked
SELECT 
    u.email,
    p.full_name,
    p.role,
    o.name as organization
FROM auth.users u
JOIN profiles p ON u.id = p.id  
JOIN organizations o ON p.organization_id = o.id
WHERE u.email LIKE '%26062025@test.com';

-- Display login information
SELECT 'LOGIN INFORMATION:' as info;
SELECT 'Email: lta.admin.26062025@test.com, Password: password123, Role: CARRIER_ADMIN' as lta_admin;
SELECT 'Email: dispatcher.abc.26062025@test.com, Password: password123, Role: DISPATCHER' as abc_dispatcher;
SELECT 'Email: test01.dispatcher.26062025@test.com, Password: password123, Role: DISPATCHER' as test01_dispatcher; 