-- ============================================================================
-- 02. IMPORT CONTAINERS (Dynamic - Lệnh Giao Trả - Supply)
-- Created: 26-06-2025
-- Purpose: Create 40 import containers using dynamic organization lookup
-- Note: All container numbers comply with ISO 6346 standard
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
    -- Get organization IDs by name (created in previous step)
    SELECT id INTO lta_org_id FROM organizations WHERE name = 'LTA - Logistics Technology Authority 26062025';
    SELECT id INTO abc_org_id FROM organizations WHERE name = 'Công ty Vận tải ABC 26062025';
    SELECT id INTO test01_org_id FROM organizations WHERE name = 'Vận tải Test 01 26062025';
    SELECT id INTO xyz_shipping_id FROM organizations WHERE name = 'Hãng tàu XYZ 26062025';
    SELECT id INTO maersk_shipping_id FROM organizations WHERE name = 'Maersk Line 26062025';
    SELECT id INTO one_shipping_id FROM organizations WHERE name = 'Ocean Network Express 26062025';

    -- Verify we found all organizations
    IF lta_org_id IS NULL OR abc_org_id IS NULL OR test01_org_id IS NULL 
       OR xyz_shipping_id IS NULL OR maersk_shipping_id IS NULL OR one_shipping_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find required organizations. Please run 01_organizations_profiles.sql first.';
    END IF;

    -- Clean up existing containers from this script (based on naming pattern)
    DELETE FROM import_containers WHERE container_number IN (
        'CSQU3054383', 'MSKU6856625', 'TCLU4265727', 'FCIU8412630', 'TRLU9876545',
        'CMAU4567891', 'APMU1234564', 'SUDU5789104', 'OOLU2048585', 'HLXU8097426',
        'EGHU9012340', 'INBU3344558', 'YMLU8889998', 'ZIMU7013459', 'SEGU5432109',
        'HJCU1122336', 'TCKU6543210', 'UACU5987452', 'MAEU8001239', 'TGHU7777774',
        'GESU9123456', 'CAXU7890123', 'HAMU3456789', 'NYKU6012345', 'EVERP789012',
        'WANU4567890', 'COSU9876543', 'MSCU1122334', 'PONU5566778', 'TEMU9988776',
        'KKTU1234567', 'YAMU7890123', 'SEAGU456789', 'CITU1357902', 'BMOU2468135',
        'SITU3691470', 'MARU4815926', 'CAIU5938271', 'DRYU6049384', 'EMCU7150495',
        'CRXU8261506'
    );

    -- Alternative: Use completely new container numbers to avoid any conflicts
    -- Generate new ISO 6346 compliant container numbers with prefix "NEW2606"

    -- ============================================================================
    -- CASE 1.1A: Internal Street-turn "Trên Đường" - NVT ABC
    -- 5 LGT cho NVT ABC, sẽ có LLR tương ứng từ cùng NVT ABC
    -- ============================================================================
    INSERT INTO import_containers (
        container_number, container_type, container_type_id, drop_off_location, available_from_datetime, 
        trucking_company_org_id, shipping_line_org_id, status, cargo_type_id, 
        condition_images, attached_documents, is_listed_on_marketplace, depot_id, 
        latitude, longitude, created_at, updated_at
    ) VALUES
    ('NEWU2606001', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM', '2025-06-27 08:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, false, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', 10.75710000, 106.78450000, now(), now()),
    ('NEWU2606002', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Phước Long 3, TP.HCM', '2025-06-27 09:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, false, '9a0fe470-d3ae-4a51-ae3b-217db367b329', 10.82470000, 106.77250000, now(), now()),
    ('NEWU2606003', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Transimex, TP.HCM', '2025-06-27 10:00:00+07', abc_org_id, one_shipping_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, null, false, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', 10.85240000, 106.76450000, now(), now()),
    ('NEWU2606004', (SELECT code FROM container_types WHERE id = '106815aa-56d2-4e31-a15a-ef7bdbfe5d97'), '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Tanamexco, TP.HCM', '2025-06-27 11:00:00+07', abc_org_id, xyz_shipping_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, null, false, '814cde2d-95b2-41fc-8ed0-271ba2170968', 10.87120000, 106.77010000, now(), now()),
    ('NEWU2606005', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'Bình Dương Port, Bình Dương', '2025-06-27 12:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, null, false, '288f81f9-3b22-4e9c-be2b-2dc52d0f3b29', 10.90280000, 106.71190000, now(), now()),

    -- ============================================================================
    -- CASE 1.1B: Internal Street-turn "Tại Depot" - NVT ABC
    -- ============================================================================
    ('NEWU2606006', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Tân Cảng Sóng Thần, Bình Dương', '2025-06-27 14:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, false, '2b7bd9fc-f236-48cb-8667-ad62c2eb4a01', 10.89530000, 106.75610000, now(), now()),
    ('NEWU2606007', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Cảng Sóng Thần, Bình Dương', '2025-06-27 15:00:00+07', abc_org_id, one_shipping_id, 'AVAILABLE', '77a84655-0e9e-427c-9b1a-1921d3f0ac52', null, null, false, '2b7bd9fc-f236-48cb-8667-ad62c2eb4a01', 10.89530000, 106.75610000, now(), now()),

    -- ============================================================================
    -- CASE 1.2: Cùng NVT, Khác HT - NVT Test 01
    -- ============================================================================
    ('NEWU2606008', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Tân Cảng Long Bình, Đồng Nai', '2025-06-27 16:00:00+07', test01_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, false, 'c1ba1ff2-3eaf-48f4-82f1-41e3a68d55a1', 10.94150000, 106.90480000, now(), now()),
    ('NEWU2606009', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Cảng Nhơn Trạch, Đồng Nai', '2025-06-27 17:00:00+07', test01_org_id, maersk_shipping_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, null, false, 'a2dbd7dc-34da-4bf1-bb57-b7bcd3b014da', 10.66980000, 106.87320000, now(), now()),
    ('NEWU2606010', (SELECT code FROM container_types WHERE id = '106815aa-56d2-4e31-a15a-ef7bdbfe5d97'), '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ECS Depot Biên Hòa, Đồng Nai', '2025-06-27 18:00:00+07', test01_org_id, maersk_shipping_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, null, false, 'e231c92f-f237-40ba-8b35-9040bb3f6e23', 10.93270000, 106.86420000, now(), now()),

    -- ============================================================================
    -- CASE 1.3: Marketplace "Bán Lệnh" - NVT ABC Listed
    -- ============================================================================
    ('NEWU2606011', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM', '2025-06-28 08:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, true, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', 10.75710000, 106.78450000, now(), now()),
    ('NEWU2606012', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phước Long 3, TP.HCM', '2025-06-28 09:00:00+07', abc_org_id, one_shipping_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, null, true, '9a0fe470-d3ae-4a51-ae3b-217db367b329', 10.82470000, 106.77250000, now(), now()),
    ('NEWU2606013', (SELECT code FROM container_types WHERE id = '106815aa-56d2-4e31-a15a-ef7bdbfe5d97'), '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Transimex, TP.HCM', '2025-06-28 10:00:00+07', abc_org_id, xyz_shipping_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, null, true, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', 10.85240000, 106.76450000, now(), now()),
    ('NEWU2606014', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tanamexco, TP.HCM', '2025-06-28 11:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, null, true, '814cde2d-95b2-41fc-8ed0-271ba2170968', 10.87120000, 106.77010000, now(), now()),
    ('NEWU2606015', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Solog Depot, Bình Dương', '2025-06-28 12:00:00+07', abc_org_id, one_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, true, '4fc4a6ab-d018-482d-bfe4-275a66531e86', 10.90150000, 106.74120000, now(), now()),

    -- ============================================================================
    -- CASE 3.1 & 3.2: COD + Street-turn
    -- ============================================================================
    ('NEWU2606016', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Hải Linh, Phú Thọ', '2025-06-29 08:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, false, '14a5a813-5a82-42e7-bf9c-6531d9079476', 21.35410000, 105.41920000, now(), now()),
    ('NEWU2606017', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Cảng Hà Nam, Hà Nam', '2025-06-29 09:00:00+07', test01_org_id, one_shipping_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, null, true, '6d2f28b0-ffba-42b5-a905-22f9358a8a5b', 20.50150000, 105.92830000, now(), now()),
    ('NEWU2606018', (SELECT code FROM container_types WHERE id = '106815aa-56d2-4e31-a15a-ef7bdbfe5d97'), '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Tân Cảng Hải Phòng, Hải Phòng', '2025-06-29 10:00:00+07', abc_org_id, xyz_shipping_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, null, true, '968c5794-75e4-4ba4-9939-a234dde8d84d', 20.86530000, 106.65020000, now(), now()),
    ('NEWU2606019', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tân Cảng Quế Võ, Bắc Ninh', '2025-06-29 11:00:00+07', test01_org_id, maersk_shipping_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, null, false, 'd2903cf6-dbdf-4a75-8ce7-93e3b0092e49', 21.12780000, 106.09640000, now(), now()),

    -- ============================================================================
    -- CASE 4: Staging for Delayed Street-turn
    -- ============================================================================
    ('NEWU2606020', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM', '2025-06-27 08:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, false, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', 10.75710000, 106.78450000, now(), now()),
    ('NEWU2606021', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phước Long 3, TP.HCM', '2025-06-27 09:00:00+07', test01_org_id, one_shipping_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, null, true, '9a0fe470-d3ae-4a51-ae3b-217db367b329', 10.82470000, 106.77250000, now(), now()),
    ('NEWU2606022', (SELECT code FROM container_types WHERE id = '106815aa-56d2-4e31-a15a-ef7bdbfe5d97'), '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Transimex, TP.HCM', '2025-06-27 10:00:00+07', abc_org_id, xyz_shipping_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, null, false, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', 10.85240000, 106.76450000, now(), now()),
    ('NEWU2606023', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Tanamexco, TP.HCM', '2025-06-27 11:00:00+07', test01_org_id, maersk_shipping_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, null, true, '814cde2d-95b2-41fc-8ed0-271ba2170968', 10.87120000, 106.77010000, now(), now()),

    -- ============================================================================
    -- CASE: Quality Mismatch - VAS Required
    -- ============================================================================
    ('NEWU2606024', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'Cảng Cát Lái, TP.HCM - Khu A (dơ, có mùi)', '2025-06-30 08:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', '{"https://example.com/dirty_container1.jpg", "https://example.com/smell_container1.jpg"}', null, false, 'd4d45641-60ba-468d-ac8f-d7012e5a9cdf', 10.75710000, 106.78450000, now(), now()),
    ('NEWU2606025', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phước Long 3, TP.HCM (sàn thủng nhẹ)', '2025-06-30 09:00:00+07', test01_org_id, one_shipping_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', '{"https://example.com/damaged_floor1.jpg", "https://example.com/damaged_floor2.jpg"}', null, true, '9a0fe470-d3ae-4a51-ae3b-217db367b329', 10.82470000, 106.77250000, now(), now()),
    ('NEWU2606026', (SELECT code FROM container_types WHERE id = '106815aa-56d2-4e31-a15a-ef7bdbfe5d97'), '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'ICD Transimex, TP.HCM (có mùi lạ)', '2025-06-30 10:00:00+07', abc_org_id, xyz_shipping_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', '{"https://example.com/strange_smell1.jpg"}', null, false, 'c9c7790f-b3dd-432c-aee7-3b3413a0de35', 10.85240000, 106.76450000, now(), now());

    -- ============================================================================
    -- Additional 14 containers for general testing (total 40)
    -- ============================================================================
    INSERT INTO import_containers (
        container_number, container_type, container_type_id, drop_off_location, available_from_datetime, 
        trucking_company_org_id, shipping_line_org_id, status, cargo_type_id, 
        condition_images, attached_documents, is_listed_on_marketplace, depot_id, 
        latitude, longitude, created_at, updated_at
    ) VALUES
    ('NEWU2606027', (SELECT code FROM container_types WHERE id = '151ab168-16fc-4679-a14a-617486235399'), '151ab168-16fc-4679-a14a-617486235399', 'ICD Phú Mỹ 1, BR-VT', '2025-07-01 08:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', 'fc79e5a3-64eb-4d06-950f-aa7efc6209ac', null, null, true, '8f1c804e-0382-4f7f-8229-dda365aba5a2', 10.56380000, 107.03150000, now(), now()),
    ('NEWU2606028', (SELECT code FROM container_types WHERE id = '3063f1c9-2f7b-47e1-a4cb-38d1ecf79f13'), '3063f1c9-2f7b-47e1-a4cb-38d1ecf79f13', 'ICD Long Biên, Hà Nội', '2025-07-01 09:00:00+07', test01_org_id, one_shipping_id, 'AVAILABLE', 'fc79e5a3-64eb-4d06-950f-aa7efc6209ac', null, null, false, '7c69d43b-f991-45bc-8f71-c28076888f37', 21.03750000, 105.92380000, now(), now()),
    ('NEWU2606029', (SELECT code FROM container_types WHERE id = 'a9d92a14-5f7d-4730-b9c9-e689f5a00b80'), 'a9d92a14-5f7d-4730-b9c9-e689f5a00b80', 'ICD Gia Lâm, Hà Nội', '2025-07-01 10:00:00+07', abc_org_id, xyz_shipping_id, 'AWAITING_APPROVAL', 'f906807b-1a62-4361-98c2-67f2c53f5c7a', null, null, false, 'c617e8c8-7afe-4d28-a5ca-1379d9501be5', 21.03510000, 105.93870000, now(), now()),
    ('NEWU2606030', (SELECT code FROM container_types WHERE id = 'ecfd724c-3311-4416-a4e7-147c5e8990bc'), 'ecfd724c-3311-4416-a4e7-147c5e8990bc', 'VIP Green Port, Hải Phòng', '2025-07-01 11:00:00+07', test01_org_id, maersk_shipping_id, 'AVAILABLE', 'f906807b-1a62-4361-98c2-67f2c53f5c7a', null, null, true, '366ff3a9-430e-4055-af48-9d674e4aaf15', 20.84590000, 106.76290000, now(), now()),
    ('NEWU2606031', (SELECT code FROM container_types WHERE id = 'cfabd462-95e5-450b-9018-0a535f0908e7'), 'cfabd462-95e5-450b-9018-0a535f0908e7', 'ICD Hoàng Thành, Hải Phòng', '2025-07-01 12:00:00+07', abc_org_id, one_shipping_id, 'AVAILABLE', 'f906807b-1a62-4361-98c2-67f2c53f5c7a', null, null, false, '1bf4bb87-9e44-4beb-b337-1f45a58fd731', 20.84910000, 106.75880000, now(), now()),
    ('NEWU2606032', (SELECT code FROM container_types WHERE id = '7ef0c644-cd21-47e7-b00b-d9df2e8ca7ab'), '7ef0c644-cd21-47e7-b00b-d9df2e8ca7ab', 'ICD Nam Đình Vũ, Hải Phòng', '2025-07-01 13:00:00+07', test01_org_id, xyz_shipping_id, 'CONFIRMED', '1b45c2a6-09b0-421f-b1cc-750d6cd46f61', null, null, false, 'e0228558-58ba-4d45-a257-b7b4d171f06e', 20.83150000, 106.80430000, now(), now()),
    ('NEWU2606033', (SELECT code FROM container_types WHERE id = 'ecce2283-75a0-4345-a133-d888de0e21fa'), 'ecce2283-75a0-4345-a133-d888de0e21fa', 'ICD Đình Vũ, Hải Phòng', '2025-07-01 14:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', 'fc79e5a3-64eb-4d06-950f-aa7efc6209ac', null, null, true, 'f462ddec-0f01-46ff-ab43-5b20ef20355b', 20.85410000, 106.78250000, now(), now()),
    ('NEWU2606034', (SELECT code FROM container_types WHERE id = 'baed63d0-4b42-4c7e-b5a6-b70082553bc7'), 'baed63d0-4b42-4c7e-b5a6-b70082553bc7', 'Gemadept Đà Nẵng', '2025-07-01 15:00:00+07', test01_org_id, one_shipping_id, 'AVAILABLE', '36c64276-28b6-45c9-a727-84762aed9886', null, null, false, '3018212c-4657-445f-8226-9f11513c4879', 16.12050000, 108.23210000, now(), now()),
    ('NEWU2606035', (SELECT code FROM container_types WHERE id = '0776373e-9491-496d-923b-cb9473106dd9'), '0776373e-9491-496d-923b-cb9473106dd9', 'Viconship Đà Nẵng', '2025-07-01 16:00:00+07', abc_org_id, xyz_shipping_id, 'AVAILABLE', 'f906807b-1a62-4361-98c2-67f2c53f5c7a', null, null, true, '79531671-cb34-42f7-8c43-e544bfe2e4bf', 16.07920000, 108.22410000, now(), now()),
    ('NEWU2606036', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Thanh Phước, Tây Ninh', '2025-07-01 17:00:00+07', test01_org_id, maersk_shipping_id, 'AVAILABLE', '69bc5552-f8e1-4e70-b2d2-77ab70e9b484', null, null, false, '6553f989-77e9-4459-a327-a8f21d0c52b3', 11.13960000, 106.31570000, now(), now()),
    ('NEWU2606037', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'Cảng Cái Cui Cần Thơ', '2025-07-01 18:00:00+07', abc_org_id, one_shipping_id, 'AVAILABLE', '32e1ee48-2231-405b-aa2b-ddc93bcecb36', null, null, true, '43bd4be6-9cce-48a9-a3cc-09f8ee7596c2', 10.02910000, 105.78390000, now(), now()),
    ('NEWU2606038', (SELECT code FROM container_types WHERE id = '106815aa-56d2-4e31-a15a-ef7bdbfe5d97'), '106815aa-56d2-4e31-a15a-ef7bdbfe5d97', 'Cảng Lee & Man, Hậu Giang', '2025-07-01 19:00:00+07', test01_org_id, xyz_shipping_id, 'AWAITING_APPROVAL', '77a84655-0e9e-427c-9b1a-1921d3f0ac52', null, null, false, '2028d662-e7e4-4c3c-94ee-4c0648b71f1c', 9.94180000, 105.80160000, now(), now()),
    ('NEWU2606039', (SELECT code FROM container_types WHERE id = 'babd2f38-1da9-492f-98fb-599865a556f7'), 'babd2f38-1da9-492f-98fb-599865a556f7', 'ICD Phúc Lộc Ninh Bình', '2025-07-01 20:00:00+07', abc_org_id, maersk_shipping_id, 'AVAILABLE', '497b7575-96e8-40a4-95bd-01c2c76e6257', null, null, true, 'd0122a69-7fdb-4d0b-962d-b33cff0c7ea1', 20.21980000, 105.95370000, now(), now()),
    ('NEWU2606040', (SELECT code FROM container_types WHERE id = '2973a078-bdb4-4a12-9717-aa596fc81f7c'), '2973a078-bdb4-4a12-9717-aa596fc81f7c', 'ICD Km3+4 Móng Cái, Quảng Ninh', '2025-07-01 21:00:00+07', test01_org_id, one_shipping_id, 'AVAILABLE', 'fc5f8956-3400-43e9-9337-b2927ffcc321', null, null, false, 'cd61344a-92b2-40dc-bc3a-9dcfcaab94ee', 21.48830000, 107.94040000, now(), now());

    RAISE NOTICE 'Successfully inserted 40 import containers with unique container numbers (NEWU2606001-040)';
END $$;