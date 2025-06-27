-- ============================================================================
-- 03. EXPORT BOOKINGS (Dynamic - Lệnh Lấy Rỗng - Demand)
-- Created: 26-06-2025
-- Purpose: Create 40 export bookings using dynamic organization lookup
-- ============================================================================

DO $$
DECLARE
    lta_org_id UUID;
    abc_org_id UUID;
    test01_org_id UUID;
    xyz_shipping_id UUID;
    maersk_shipping_id UUID;
    one_shipping_id UUID;
BEGIN
    -- Get organization IDs by name
    SELECT id INTO lta_org_id FROM organizations WHERE name = 'LTA - Logistics Technology Authority 26062025';
    SELECT id INTO abc_org_id FROM organizations WHERE name = 'Công ty Vận tải ABC 26062025';
    SELECT id INTO test01_org_id FROM organizations WHERE name = 'Vận tải Test 01 26062025';
    SELECT id INTO xyz_shipping_id FROM organizations WHERE name = 'Hãng tàu XYZ 26062025';
    SELECT id INTO maersk_shipping_id FROM organizations WHERE name = 'Maersk Line 26062025';
    SELECT id INTO one_shipping_id FROM organizations WHERE name = 'Ocean Network Express 26062025';

    -- Verify we found all organizations
    IF lta_org_id IS NULL OR abc_org_id IS NULL OR test01_org_id IS NULL 
       OR xyz_shipping_id IS NULL OR maersk_shipping_id IS NULL OR one_shipping_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find required organizations. Please run previous scripts first.';
    END IF;

    -- ============================================================================
    -- INSERT ALL EXPORT BOOKINGS WITH CONTAINER TYPE LOOKUP
    -- ============================================================================
    WITH container_lookup AS (
        SELECT id, code FROM container_types
    )
    INSERT INTO export_bookings (
        booking_number, required_container_type, container_type_id, pick_up_location, needed_by_datetime, 
        trucking_company_org_id, status, cargo_type_id, attached_documents, 
        depot_id, shipping_line_org_id, created_at, updated_at
    )
    SELECT 
        booking_number, 
        cl.code as required_container_type,
        container_type_id::UUID,
        pick_up_location, 
        needed_by_datetime::TIMESTAMPTZ, 
        trucking_company_org_id, 
        status::asset_status, 
        cargo_type_id::UUID, 
        attached_documents::TEXT[], 
        depot_id::UUID, 
        shipping_line_org_id, 
        created_at, 
        updated_at
    FROM (
        VALUES
        -- ============================================================================
        -- CASE 1.1A: Internal Street-turn "Trên Đường" - NVT ABC
        -- ============================================================================
        ('LLRV240627001', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Transimex, TP.HCM', '2025-06-27 10:00:00+07', abc_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', maersk_shipping_id, now(), now()),
        ('LLRV240627002', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM', '2025-06-27 11:00:00+07', abc_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', maersk_shipping_id, now(), now()),
        ('LLRV240627003', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tanamexco, TP.HCM', '2025-06-27 12:00:00+07', abc_org_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, '814cde2d-95b2-41fc-8ed0-271ba2170968', one_shipping_id, now(), now()),
        ('LLRV240627004', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Phước Long 3, TP.HCM', '2025-06-27 13:00:00+07', abc_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, '9a0fe470-d3ae-4a51-ae3b-217db367b329', xyz_shipping_id, now(), now()),
        ('LLRV240627005', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Cảng Sóng Thần, Bình Dương', '2025-06-27 14:00:00+07', abc_org_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, '2b7bd9fc-f236-48cb-8667-ad62c2eb4a01', maersk_shipping_id, now(), now()),

        -- ============================================================================
        -- CASE 1.1B: Internal Street-turn "Tại Depot" - NVT ABC
        -- ============================================================================
        ('LLRV240627006', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Tân Cảng Sóng Thần, Bình Dương', '2025-06-27 16:00:00+07', abc_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, '2b7bd9fc-f236-48cb-8667-ad62c2eb4a01', maersk_shipping_id, now(), now()),
        ('LLRV240627007', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Cảng Sóng Thần, Bình Dương', '2025-06-27 17:00:00+07', abc_org_id, 'AVAILABLE', '77a84655-0e9e-427c-9b1a-1921d3f0ac52', null, '2b7bd9fc-f236-48cb-8667-ad62c2eb4a01', one_shipping_id, now(), now()),

        -- ============================================================================
        -- CASE 1.2: Cùng NVT, Khác HT - NVT Test 01
        -- ============================================================================
        ('LLRV240627008', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Tân Cảng Long Bình, Đồng Nai', '2025-06-27 18:00:00+07', test01_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, 'c1ba1ff2-3eaf-48f4-82f1-41e3a68d55a1', one_shipping_id, now(), now()),
        ('LLRV240627009', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Cảng Nhơn Trạch, Đồng Nai', '2025-06-27 19:00:00+07', test01_org_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, 'a2dbd7dc-34da-4bf1-bb57-b7bcd3b014da', one_shipping_id, now(), now()),
        ('LLRV240627010', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ECS Depot Biên Hòa, Đồng Nai', '2025-06-27 20:00:00+07', test01_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, 'e231c92f-f237-40ba-8b35-9040bb3f6e23', one_shipping_id, now(), now()),

        -- ============================================================================
        -- CASE 1.3: Marketplace "Bán Lệnh" - NVT Test 01
        -- ============================================================================
        ('LLRV240628001', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM', '2025-06-28 10:00:00+07', test01_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', maersk_shipping_id, now(), now()),
        ('LLRV240628002', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phước Long 3, TP.HCM', '2025-06-28 11:00:00+07', test01_org_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, '9a0fe470-d3ae-4a51-ae3b-217db367b329', one_shipping_id, now(), now()),
        ('LLRV240628003', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Transimex, TP.HCM', '2025-06-28 12:00:00+07', test01_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', xyz_shipping_id, now(), now()),
        ('LLRV240628004', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tanamexco, TP.HCM', '2025-06-28 13:00:00+07', test01_org_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, '814cde2d-95b2-41fc-8ed0-271ba2170968', maersk_shipping_id, now(), now()),
        ('LLRV240628005', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Solog Depot, Bình Dương', '2025-06-28 14:00:00+07', test01_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, '4fc4a6ab-d018-482d-bfe4-275a66531e86', one_shipping_id, now(), now()),

        -- ============================================================================
        -- CASE 3.1: COD + Street-turn Internal
        -- ============================================================================
        ('LLRV240629001', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM', '2025-06-29 10:00:00+07', abc_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', maersk_shipping_id, now(), now()),
        ('LLRV240629004', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phước Long 3, TP.HCM', '2025-06-29 13:00:00+07', test01_org_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, '9a0fe470-d3ae-4a51-ae3b-217db367b329', maersk_shipping_id, now(), now()),

        -- ============================================================================
        -- CASE 3.2: COD + Street-turn Marketplace
        -- ============================================================================
        ('LLRV240629002', 'babd2f38-1da9-492f-98fb-599865a556f7', 'Cảng Cát Lái, TP.HCM', '2025-06-29 11:00:00+07', test01_org_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', one_shipping_id, now(), now()),
        ('LLRV240629003', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Transimex, TP.HCM', '2025-06-29 12:00:00+07', abc_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', xyz_shipping_id, now(), now()),

        -- ============================================================================
        -- CASE 4: Staging for Delayed Street-turn
        -- ============================================================================
        ('LLRV240630001', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM', '2025-06-30 10:00:00+07', abc_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', maersk_shipping_id, now(), now()),
        ('LLRV240630002', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phước Long 3, TP.HCM', '2025-06-30 11:00:00+07', test01_org_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, '9a0fe470-d3ae-4a51-ae3b-217db367b329', one_shipping_id, now(), now()),
        ('LLRV240630003', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Transimex, TP.HCM', '2025-06-30 12:00:00+07', abc_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', xyz_shipping_id, now(), now()),
        ('LLRV240630004', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tanamexco, TP.HCM', '2025-06-30 13:00:00+07', test01_org_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, '814cde2d-95b2-41fc-8ed0-271ba2170968', maersk_shipping_id, now(), now()),

        -- ============================================================================
        -- CASE: Quality Mismatch - VAS Required
        -- ============================================================================
        ('LLRV240630005', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM', '2025-06-30 10:00:00+07', test01_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', maersk_shipping_id, now(), now()),
        ('LLRV240630006', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phước Long 3, TP.HCM', '2025-06-30 11:00:00+07', abc_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, '9a0fe470-d3ae-4a51-ae3b-217db367b329', one_shipping_id, now(), now()),
        ('LLRV240630007', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Transimex, TP.HCM', '2025-06-30 12:00:00+07', test01_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', xyz_shipping_id, now(), now()),

        -- ============================================================================
        -- Additional 15 export bookings for general testing (total 40)
        -- ============================================================================
        ('LLRV240701001', '151ab168-16fc-4679-a14a-617486235399', 'ICD Phú Mỹ 1, BR-VT', '2025-07-01 10:00:00+07', abc_org_id, 'AVAILABLE', 'fc79e5a3-64eb-4d06-950f-aa7efc6209ac', null, '8f1c804e-0382-4f7f-8229-dda365aba5a2', maersk_shipping_id, now(), now()),
        ('LLRV240701002', '3063f1c9-2f7b-47e1-a4cb-38d1ecf79f13', 'ICD Long Biên, Hà Nội', '2025-07-01 11:00:00+07', test01_org_id, 'AVAILABLE', 'fc79e5a3-64eb-4d06-950f-aa7efc6209ac', null, '7c69d43b-f991-45bc-8f71-c28076888f37', one_shipping_id, now(), now()),
        ('LLRV240701003', 'a9d92a14-5f7d-4730-b9c9-e689f5a00b80', 'ICD Gia Lâm, Hà Nội', '2025-07-01 12:00:00+07', abc_org_id, 'CONFIRMED', 'f906807b-1a62-4361-98c2-67f2c53f5c7a', null, 'c617e8c8-7afe-4d28-a5ca-1379d9501be5', xyz_shipping_id, now(), now()),
        ('LLRV240701004', 'ecfd724c-3311-4416-a4e7-147c5e8990bc', 'VIP Green Port, Hải Phòng', '2025-07-01 13:00:00+07', test01_org_id, 'AVAILABLE', 'f906807b-1a62-4361-98c2-67f2c53f5c7a', null, '366ff3a9-430e-4055-af48-9d674e4aaf15', maersk_shipping_id, now(), now()),
        ('LLRV240701005', 'cfabd462-95e5-450b-9018-0a535f0908e7', 'ICD Hoàng Thành, Hải Phòng', '2025-07-01 14:00:00+07', abc_org_id, 'AVAILABLE', 'f906807b-1a62-4361-98c2-67f2c53f5c7a', null, '1bf4bb87-9e44-4beb-b337-1f45a58fd731', one_shipping_id, now(), now()),
        ('LLRV240701006', '7ef0c644-cd21-47e7-b00b-d9df2e8ca7ab', 'ICD Nam Đình Vũ, Hải Phòng', '2025-07-01 15:00:00+07', test01_org_id, 'AVAILABLE', '1b45c2a6-09b0-421f-b1cc-750d6cd46f61', null, 'e0228558-58ba-4d45-a257-b7b4d171f06e', xyz_shipping_id, now(), now()),
        ('LLRV240701007', 'ecce2283-75a0-4345-a133-d888de0e21fa', 'ICD Đình Vũ, Hải Phòng', '2025-07-01 16:00:00+07', abc_org_id, 'AVAILABLE', 'fc79e5a3-64eb-4d06-950f-aa7efc6209ac', null, 'f462ddec-0f01-46ff-ab43-5b20ef20355b', maersk_shipping_id, now(), now()),
        ('LLRV240701008', 'baed63d0-4b42-4c7e-b5a6-b70082553bc7', 'Gemadept Đà Nẵng', '2025-07-01 17:00:00+07', test01_org_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, '3018212c-4657-445f-8226-9f11513c4879', one_shipping_id, now(), now()),
        ('LLRV240701009', '0776373e-9491-496d-923b-cb9473106dd9', 'Viconship Đà Nẵng', '2025-07-01 18:00:00+07', abc_org_id, 'AVAILABLE', 'f906807b-1a62-4361-98c2-67f2c53f5c7a', null, '79531671-cb34-42f7-8c43-e544bfe2e4bf', xyz_shipping_id, now(), now()),
        ('LLRV240701010', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Thanh Phước, Tây Ninh', '2025-07-01 19:00:00+07', test01_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, '6553f989-77e9-4459-a327-a8f21d0c52b3', maersk_shipping_id, now(), now()),
        ('LLRV240701011', 'babd2f38-1da9-492f-98fb-599865a556f7', 'Cảng Cái Cui Cần Thơ', '2025-07-01 20:00:00+07', abc_org_id, 'CONFIRMED', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, '43bd4be6-9cce-48a9-a3cc-09f8ee7596c2', one_shipping_id, now(), now()),
        ('LLRV240701012', '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Cảng Lee & Man, Hậu Giang', '2025-07-01 21:00:00+07', test01_org_id, 'AVAILABLE', '77a84655-0e9e-427c-9b1a-1921d3f0ac52', null, '2028d662-e7e4-4c3c-94ee-4c0648b71f1c', xyz_shipping_id, now(), now()),
        ('LLRV240701013', 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phúc Lộc Ninh Bình', '2025-07-01 22:00:00+07', abc_org_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, 'd0122a69-7fdb-4d0b-962d-b33cff0c7ea1', maersk_shipping_id, now(), now()),
        ('LLRV240701014', '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Km3+4 Móng Cái, Quảng Ninh', '2025-07-01 23:00:00+07', test01_org_id, 'AVAILABLE', 'fc5f8956-3400-43e9-9337-b2927ffcc321', null, 'cd61344a-92b2-40dc-bc3a-9dcfcaab94ee', one_shipping_id, now(), now()),
        ('LLRV240702001', 'babd2f38-1da9-492f-98fb-599865a556f7', 'Cảng Cát Lái, TP.HCM', '2025-07-02 10:00:00+07', abc_org_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', xyz_shipping_id, now(), now())
    ) AS v(booking_number, container_type_id, pick_up_location, needed_by_datetime, 
           trucking_company_org_id, status, cargo_type_id, attached_documents, 
           depot_id, shipping_line_org_id, created_at, updated_at)
    LEFT JOIN container_lookup cl ON v.container_type_id::UUID = cl.id;

    RAISE NOTICE 'Successfully inserted 40 export bookings';
END $$;