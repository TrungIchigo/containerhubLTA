-- ============================================================================
-- DEBUG AUTH USERS - Kiểm tra tình trạng users hiện tại
-- ============================================================================

-- 1. Kiểm tra users hiện có trong auth.users
SELECT 'Current auth.users with 26062025:' as info;
SELECT id, email, encrypted_password, email_confirmed_at, created_at
FROM auth.users 
WHERE email LIKE '%26062025%';

-- 2. Kiểm tra profiles liên kết
SELECT 'Current profiles with 26062025:' as info;
SELECT p.id, p.full_name, p.role, o.name as organization, u.email
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE o.name LIKE '%26062025%';

-- 3. Kiểm tra organizations đã tạo
SELECT 'Organizations created:' as info;
SELECT id, name, type 
FROM organizations 
WHERE name LIKE '%26062025%';

-- 4. Xóa users cũ và tạo lại (nếu cần)
-- DELETE FROM auth.users WHERE email LIKE '%26062025@test.com';

-- 5. Tạo users mới với proper password hash
-- Sử dụng extensions.crypt để hash password đúng cách
DO $$
DECLARE
    lta_org_id UUID;
    abc_org_id UUID;
    test01_org_id UUID;
BEGIN
    -- Lấy organization IDs
    SELECT id INTO lta_org_id FROM organizations WHERE name = 'LTA - Logistics Technology Authority 26062025';
    SELECT id INTO abc_org_id FROM organizations WHERE name = 'Công ty Vận tải ABC 26062025';
    SELECT id INTO test01_org_id FROM organizations WHERE name = 'Vận tải Test 01 26062025';

    -- Xóa users cũ nếu có
    DELETE FROM profiles WHERE id IN (
        '11111111-1111-4111-1111-111111111111',
        '22222222-2222-4222-2222-222222222222', 
        '33333333-3333-4333-3333-333333333333'
    );
    
    DELETE FROM auth.users WHERE email IN (
        'lta.admin.26062025@test.com',
        'dispatcher.abc.26062025@test.com',
        'test01.dispatcher.26062025@test.com'
    );

    -- Tạo users mới với password hash từ Supabase (password: test123)
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    ) VALUES 
    (
        '11111111-1111-4111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'lta.admin.26062025@test.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
        now(),
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        '22222222-2222-4222-2222-222222222222',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'dispatcher.abc.26062025@test.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
        now(),
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        '33333333-3333-4333-3333-333333333333',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'test01.dispatcher.26062025@test.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
        now(),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- Tạo profiles
    INSERT INTO profiles (id, full_name, organization_id, role, created_at, updated_at) VALUES
    ('11111111-1111-4111-1111-111111111111', 'LTA System Admin 26062025', lta_org_id, 'CARRIER_ADMIN', now(), now()),
    ('22222222-2222-4222-2222-222222222222', 'Dispatcher Vantai ABC 26062025', abc_org_id, 'DISPATCHER', now(), now()),
    ('33333333-3333-4333-3333-333333333333', 'MVP Test User 01 26062025', test01_org_id, 'DISPATCHER', now(), now());

    RAISE NOTICE 'Users created successfully with password: password';
END $$;

-- 6. Verify kết quả
SELECT 'FINAL VERIFICATION:' as info;
SELECT 
    u.email,
    p.full_name,
    p.role,
    o.name as organization,
    u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
JOIN profiles p ON u.id = p.id  
JOIN organizations o ON p.organization_id = o.id
WHERE u.email LIKE '%26062025@test.com';

-- 7. Login instructions
SELECT '=== LOGIN INSTRUCTIONS ===' as instructions;
SELECT 'Email: lta.admin.26062025@test.com' as email, 'Password: password' as password, 'Role: CARRIER_ADMIN' as role;
SELECT 'Email: dispatcher.abc.26062025@test.com' as email, 'Password: password' as password, 'Role: DISPATCHER' as role;
SELECT 'Email: test01.dispatcher.26062025@test.com' as email, 'Password: password' as password, 'Role: DISPATCHER' as role; 