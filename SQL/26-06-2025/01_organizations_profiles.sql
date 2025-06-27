-- ============================================================================
-- 01. ORGANIZATIONS & PROFILES SETUP
-- Created: 26-06-2025
-- Purpose: Create base organizations and user profiles for comprehensive testing
-- ============================================================================

-- Organizations (UUID will be auto-generated)
-- Store generated IDs in variables for reference
DO $$
DECLARE
    lta_org_id UUID;
    abc_org_id UUID;
    test01_org_id UUID;
    xyz_shipping_id UUID;
    maersk_shipping_id UUID;
    one_shipping_id UUID;
BEGIN
    -- Insert LTA Admin Organization (as TRUCKING_COMPANY but with CARRIER_ADMIN role)
    INSERT INTO organizations (name, type, tax_code, address, status, created_at, updated_at) 
    VALUES ('LTA - Logistics Technology Authority 26062025', 'TRUCKING_COMPANY', '2606202501', 'Tòa nhà LTA, Quận 1, TP.HCM', 'ACTIVE', now(), now())
    RETURNING id INTO lta_org_id;

    -- Insert Trucking Companies
    INSERT INTO organizations (name, type, tax_code, address, status, created_at, updated_at) 
    VALUES ('Công ty Vận tải ABC 26062025', 'TRUCKING_COMPANY', '2606202502', '123 Đường ABC, Quận 3, TP.HCM', 'ACTIVE', now(), now())
    RETURNING id INTO abc_org_id;

    INSERT INTO organizations (name, type, tax_code, address, status, created_at, updated_at) 
    VALUES ('Vận tải Test 01 26062025', 'TRUCKING_COMPANY', '2606202503', '456 Đường Test, Quận 7, TP.HCM', 'ACTIVE', now(), now())
    RETURNING id INTO test01_org_id;

    -- Insert Shipping Lines
    INSERT INTO organizations (name, type, tax_code, address, status, created_at, updated_at) 
    VALUES ('Hãng tàu XYZ 26062025', 'SHIPPING_LINE', '2606202504', 'Cảng XYZ, Quận 4, TP.HCM', 'ACTIVE', now(), now())
    RETURNING id INTO xyz_shipping_id;

    INSERT INTO organizations (name, type, tax_code, address, status, created_at, updated_at) 
    VALUES ('Maersk Line 26062025', 'SHIPPING_LINE', '2606202505', 'Maersk Building, District 1, Ho Chi Minh City', 'ACTIVE', now(), now())
    RETURNING id INTO maersk_shipping_id;

    INSERT INTO organizations (name, type, tax_code, address, status, created_at, updated_at) 
    VALUES ('Ocean Network Express 26062025', 'SHIPPING_LINE', '2606202506', 'ONE Tower, Hai Phong Port Area', 'ACTIVE', now(), now())
    RETURNING id INTO one_shipping_id;

    -- Insert dummy users into auth.users table first (required for foreign key constraint)
    -- Note: In production, these would be created through Supabase Auth registration
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
        '$2a$10$DummyHashForTestingPurposesOnly123456789',
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
        '$2a$10$DummyHashForTestingPurposesOnly123456789',
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
        '$2a$10$DummyHashForTestingPurposesOnly123456789',
        now(),
        now(),
        now(),
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (id) DO NOTHING; -- Ignore if users already exist

    -- Insert User Profiles using the generated organization IDs and fixed UUIDs for testing
    -- Note: In production, these IDs would come from Supabase Auth users
    INSERT INTO profiles (id, full_name, organization_id, role, created_at, updated_at) VALUES
    ('11111111-1111-4111-1111-111111111111', 'LTA System Admin 26062025', lta_org_id, 'CARRIER_ADMIN', now(), now()),
    ('22222222-2222-4222-2222-222222222222', 'Dispatcher Vantai ABC 26062025', abc_org_id, 'DISPATCHER', now(), now()),
    ('33333333-3333-4333-3333-333333333333', 'MVP Test User 01 26062025', test01_org_id, 'DISPATCHER', now(), now());

    -- Display the generated IDs for reference in subsequent scripts
    RAISE NOTICE 'Generated Organization IDs:';
    RAISE NOTICE 'LTA Admin: %', lta_org_id;
    RAISE NOTICE 'ABC Trucking: %', abc_org_id;
    RAISE NOTICE 'Test01 Trucking: %', test01_org_id;
    RAISE NOTICE 'XYZ Shipping: %', xyz_shipping_id;
    RAISE NOTICE 'Maersk Shipping: %', maersk_shipping_id;
    RAISE NOTICE 'ONE Shipping: %', one_shipping_id;
END $$;

-- Authentication table entries (if using Supabase auth.users)
-- Note: In production, these would be created through Supabase Auth
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) VALUES
-- ('11111111-1111-4111-1111-111111111111', 'lta.admin.26062025@example.com', '$2a$10$encrypted_password_hash', now(), now(), now()),
-- ('0b015b88-d14d-46dc-98ae-c7e541885dbc', 'dispatcher.abc.26062025@example.com', '$2a$10$encrypted_password_hash', now(), now(), now()),
-- ('f36abc53-7ccf-4f51-ad33-c5bc9c573956', 'mvp.test.26062025@example.com', '$2a$10$encrypted_password_hash', now(), now(), now()); 