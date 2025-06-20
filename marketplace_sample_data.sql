-- Marketplace Sample Data Creation Script
-- Description: Creates sample data for the marketplace to demonstrate cross-company container reuse opportunities
-- Date: 2024-12-18
-- Version: 1.0

BEGIN;

-- First, create additional trucking companies for marketplace diversity
INSERT INTO organizations (id, name, type, tax_code, address, phone_number, status, created_at) VALUES
  (gen_random_uuid(), 'Công ty Vận Tải ABC', 'TRUCKING_COMPANY', '0123456789', '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM', '0901234567', 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Dịch Vụ Logistics XYZ', 'TRUCKING_COMPANY', '0987654321', '456 Đường Võ Văn Kiệt, Quận 5, TP.HCM', '0912345678', 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Vận Tải Container DEF', 'TRUCKING_COMPANY', '0147258369', '789 Đường Đồng Khởi, Quận 1, TP.HCM', '0923456789', 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Logistics Express GHI', 'TRUCKING_COMPANY', '0369258147', '321 Đường Lê Duẩn, Quận 3, TP.HCM', '0934567890', 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Vận Chuyển Hàng Hóa JKL', 'TRUCKING_COMPANY', '0258147963', '654 Đường Nguyễn Thái Học, Quận 1, TP.HCM', '0945678901', 'ACTIVE', NOW())
ON CONFLICT (tax_code) DO NOTHING;

-- Create some additional shipping lines if needed
INSERT INTO organizations (id, name, type, tax_code, address, phone_number, status, created_at) VALUES
  (gen_random_uuid(), 'Maersk Line Vietnam', 'SHIPPING_LINE', '5001234567', 'Saigon Port, Quận 4, TP.HCM', '0890123456', 'ACTIVE', NOW()),
  (gen_random_uuid(), 'COSCO Shipping Lines', 'SHIPPING_LINE', '5009876543', 'Cat Lai Port, Quận 2, TP.HCM', '0890234567', 'ACTIVE', NOW()),
  (gen_random_uuid(), 'Evergreen Marine', 'SHIPPING_LINE', '5001357924', 'Tan Cang Port, Quận 4, TP.HCM', '0890345678', 'ACTIVE', NOW()),
  (gen_random_uuid(), 'MSC Mediterranean', 'SHIPPING_LINE', '5002468135', 'Hiep Phuoc Port, Quận 7, TP.HCM', '0890456789', 'ACTIVE', NOW()),
  (gen_random_uuid(), 'OOCL Orient Overseas', 'SHIPPING_LINE', '5003691470', 'Cai Mep Port, Vũng Tàu', '0890567890', 'ACTIVE', NOW())
ON CONFLICT (tax_code) DO NOTHING;

-- Get organization IDs for sample data creation
DO $$
DECLARE
    trucking_abc_id UUID;
    trucking_xyz_id UUID;
    trucking_def_id UUID;
    trucking_ghi_id UUID;
    trucking_jkl_id UUID;
    
    maersk_id UUID;
    cosco_id UUID;
    evergreen_id UUID;
    msc_id UUID;
    oocl_id UUID;
    
    hcm_city_id UUID;
    hanoi_city_id UUID;
    haiphong_city_id UUID;
    danang_city_id UUID;
    
    depot_hcm_id UUID;
    depot_hanoi_id UUID;
    depot_haiphong_id UUID;
    depot_danang_id UUID;
    
    container_type_20gp_id UUID;
    container_type_40gp_id UUID;
    container_type_40hc_id UUID;
    container_type_45hc_id UUID;
    
    cargo_type_general_id UUID;
    cargo_type_electronics_id UUID;
    cargo_type_textiles_id UUID;
    cargo_type_machinery_id UUID;
BEGIN
    -- Get trucking company IDs
    SELECT id INTO trucking_abc_id FROM organizations WHERE name = 'Công ty Vận Tải ABC' LIMIT 1;
    SELECT id INTO trucking_xyz_id FROM organizations WHERE name = 'Dịch Vụ Logistics XYZ' LIMIT 1;
    SELECT id INTO trucking_def_id FROM organizations WHERE name = 'Vận Tải Container DEF' LIMIT 1;
    SELECT id INTO trucking_ghi_id FROM organizations WHERE name = 'Logistics Express GHI' LIMIT 1;
    SELECT id INTO trucking_jkl_id FROM organizations WHERE name = 'Vận Chuyển Hàng Hóa JKL' LIMIT 1;
    
    -- Get shipping line IDs
    SELECT id INTO maersk_id FROM organizations WHERE name = 'Maersk Line Vietnam' LIMIT 1;
    SELECT id INTO cosco_id FROM organizations WHERE name = 'COSCO Shipping Lines' LIMIT 1;
    SELECT id INTO evergreen_id FROM organizations WHERE name = 'Evergreen Marine' LIMIT 1;
    SELECT id INTO msc_id FROM organizations WHERE name = 'MSC Mediterranean' LIMIT 1;
    SELECT id INTO oocl_id FROM organizations WHERE name = 'OOCL Orient Overseas' LIMIT 1;
    
    -- Get city IDs
    SELECT id INTO hcm_city_id FROM cities WHERE name ILIKE '%hồ chí minh%' OR name ILIKE '%tp.hcm%' OR name ILIKE '%saigon%' LIMIT 1;
    SELECT id INTO hanoi_city_id FROM cities WHERE name ILIKE '%hà nội%' OR name ILIKE '%hanoi%' LIMIT 1;
    SELECT id INTO haiphong_city_id FROM cities WHERE name ILIKE '%hải phòng%' OR name ILIKE '%haiphong%' LIMIT 1;
    SELECT id INTO danang_city_id FROM cities WHERE name ILIKE '%đà nẵng%' OR name ILIKE '%da nang%' LIMIT 1;
    
    -- Create cities if they don't exist
    IF hcm_city_id IS NULL THEN
        INSERT INTO cities (id, name, created_at) 
        VALUES (gen_random_uuid(), 'Thành phố Hồ Chí Minh', NOW())
        RETURNING id INTO hcm_city_id;
    END IF;
    
    IF hanoi_city_id IS NULL THEN
        INSERT INTO cities (id, name, created_at) 
        VALUES (gen_random_uuid(), 'Hà Nội', NOW())
        RETURNING id INTO hanoi_city_id;
    END IF;
    
    IF haiphong_city_id IS NULL THEN
        INSERT INTO cities (id, name, created_at) 
        VALUES (gen_random_uuid(), 'Hải Phòng', NOW())
        RETURNING id INTO haiphong_city_id;
    END IF;
    
    IF danang_city_id IS NULL THEN
        INSERT INTO cities (id, name, created_at) 
        VALUES (gen_random_uuid(), 'Đà Nẵng', NOW())
        RETURNING id INTO danang_city_id;
    END IF;
    
    -- Get depot IDs
    SELECT id INTO depot_hcm_id FROM depots WHERE city_id = hcm_city_id LIMIT 1;
    SELECT id INTO depot_hanoi_id FROM depots WHERE city_id = hanoi_city_id LIMIT 1;
    SELECT id INTO depot_haiphong_id FROM depots WHERE city_id = haiphong_city_id LIMIT 1;
    SELECT id INTO depot_danang_id FROM depots WHERE city_id = danang_city_id LIMIT 1;
    
    -- Create depots if they don't exist
    IF depot_hcm_id IS NULL THEN
        INSERT INTO depots (id, name, address, city_id, latitude, longitude, created_at) 
        VALUES (gen_random_uuid(), 'Depot Cát Lái', 'Cảng Cát Lái, Quận 2, TP.HCM', hcm_city_id, 10.7626, 106.7194, NOW())
        RETURNING id INTO depot_hcm_id;
    END IF;
    
    IF depot_hanoi_id IS NULL THEN
        INSERT INTO depots (id, name, address, city_id, latitude, longitude, created_at) 
        VALUES (gen_random_uuid(), 'Depot Văn Điển', 'Depot Văn Điển, Thanh Trì, Hà Nội', hanoi_city_id, 20.9527, 105.8492, NOW())
        RETURNING id INTO depot_hanoi_id;
    END IF;
    
    IF depot_haiphong_id IS NULL THEN
        INSERT INTO depots (id, name, address, city_id, latitude, longitude, created_at) 
        VALUES (gen_random_uuid(), 'Depot Hải Phòng', 'Cảng Hải Phòng, Quận Lê Chân, Hải Phòng', haiphong_city_id, 20.8449, 106.6881, NOW())
        RETURNING id INTO depot_haiphong_id;
    END IF;
    
    IF depot_danang_id IS NULL THEN
        INSERT INTO depots (id, name, address, city_id, latitude, longitude, created_at) 
        VALUES (gen_random_uuid(), 'Depot Đà Nẵng', 'Cảng Đà Nẵng, Quận Hải Châu, Đà Nẵng', danang_city_id, 16.0544, 108.2022, NOW())
        RETURNING id INTO depot_danang_id;
    END IF;
    
    -- Get container type IDs
    SELECT id INTO container_type_20gp_id FROM container_types WHERE code = '20GP' LIMIT 1;
    SELECT id INTO container_type_40gp_id FROM container_types WHERE code = '40GP' LIMIT 1;
    SELECT id INTO container_type_40hc_id FROM container_types WHERE code = '40HC' LIMIT 1;
    SELECT id INTO container_type_45hc_id FROM container_types WHERE code = '45HC' LIMIT 1;
    
    -- Check if container types exist, if not create them
    IF container_type_20gp_id IS NULL THEN
        INSERT INTO container_types (id, code, name, description, created_at) 
        VALUES (gen_random_uuid(), '20GP', '20-foot General Purpose', 'Standard 20-foot container', NOW())
        RETURNING id INTO container_type_20gp_id;
    END IF;
    
    IF container_type_40gp_id IS NULL THEN
        INSERT INTO container_types (id, code, name, description, created_at) 
        VALUES (gen_random_uuid(), '40GP', '40-foot General Purpose', 'Standard 40-foot container', NOW())
        RETURNING id INTO container_type_40gp_id;
    END IF;
    
    IF container_type_40hc_id IS NULL THEN
        INSERT INTO container_types (id, code, name, description, created_at) 
        VALUES (gen_random_uuid(), '40HC', '40-foot High Cube', '40-foot high cube container', NOW())
        RETURNING id INTO container_type_40hc_id;
    END IF;
    
    IF container_type_45hc_id IS NULL THEN
        INSERT INTO container_types (id, code, name, description, created_at) 
        VALUES (gen_random_uuid(), '45HC', '45-foot High Cube', '45-foot high cube container', NOW())
        RETURNING id INTO container_type_45hc_id;
    END IF;
    
    -- Get cargo type IDs
    SELECT id INTO cargo_type_general_id FROM cargo_types WHERE name ILIKE '%general%' OR name ILIKE '%tổng hợp%' LIMIT 1;
    SELECT id INTO cargo_type_electronics_id FROM cargo_types WHERE name ILIKE '%electronics%' OR name ILIKE '%điện tử%' LIMIT 1;
    SELECT id INTO cargo_type_textiles_id FROM cargo_types WHERE name ILIKE '%textiles%' OR name ILIKE '%dệt may%' LIMIT 1;
    SELECT id INTO cargo_type_machinery_id FROM cargo_types WHERE name ILIKE '%machinery%' OR name ILIKE '%máy móc%' LIMIT 1;
    
    -- Check if cargo types exist, if not create them
    IF cargo_type_general_id IS NULL THEN
        INSERT INTO cargo_types (id, name, description, created_at) 
        VALUES (gen_random_uuid(), 'General Cargo', 'Hàng hóa tổng hợp', NOW())
        RETURNING id INTO cargo_type_general_id;
    END IF;
    
    IF cargo_type_electronics_id IS NULL THEN
        INSERT INTO cargo_types (id, name, description, created_at) 
        VALUES (gen_random_uuid(), 'Electronics', 'Hàng điện tử', NOW())
        RETURNING id INTO cargo_type_electronics_id;
    END IF;
    
    IF cargo_type_textiles_id IS NULL THEN
        INSERT INTO cargo_types (id, name, description, created_at) 
        VALUES (gen_random_uuid(), 'Textiles', 'Hàng dệt may', NOW())
        RETURNING id INTO cargo_type_textiles_id;
    END IF;
    
    IF cargo_type_machinery_id IS NULL THEN
        INSERT INTO cargo_types (id, name, description, created_at) 
        VALUES (gen_random_uuid(), 'Machinery', 'Máy móc thiết bị', NOW())
        RETURNING id INTO cargo_type_machinery_id;
    END IF;
    
         -- Create marketplace-ready import containers
     -- Company ABC containers
     INSERT INTO import_containers (
         id, container_number, container_type, container_type_id, cargo_type_id, city_id, depot_id,
         drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id,
         status, is_listed_on_marketplace, latitude, longitude, condition_images, attached_documents, created_at
     ) VALUES
     (gen_random_uuid(), 'MAEU1234567', '20GP', container_type_20gp_id, cargo_type_general_id, hcm_city_id, depot_hcm_id,
      'Cảng Cát Lái, Quận 2, TP.HCM', NOW() + INTERVAL '1 hour', trucking_abc_id, maersk_id,
      'AVAILABLE', true, 10.7626, 106.7194, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'MAEU2345678', '40GP', container_type_40gp_id, cargo_type_electronics_id, hcm_city_id, depot_hcm_id,
      'Cảng Tân Cảng, Quận 4, TP.HCM', NOW() + INTERVAL '2 hours', trucking_abc_id, maersk_id,
      'AVAILABLE', true, 10.7551, 106.7037, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'MAEU3456789', '40HC', container_type_40hc_id, cargo_type_textiles_id, danang_city_id, depot_danang_id,
      'Cảng Đà Nẵng, Quận Hải Châu, Đà Nẵng', NOW() + INTERVAL '3 hours', trucking_abc_id, maersk_id,
      'AVAILABLE', true, 16.0544, 108.2022, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW());
     
         -- Company XYZ containers
     INSERT INTO import_containers (
         id, container_number, container_type, container_type_id, cargo_type_id, city_id, depot_id,
         drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id,
         status, is_listed_on_marketplace, latitude, longitude, condition_images, attached_documents, created_at
     ) VALUES
     (gen_random_uuid(), 'COSU4567890', '20GP', container_type_20gp_id, cargo_type_machinery_id, haiphong_city_id, depot_haiphong_id,
      'Cảng Hải Phòng, Quận Lê Chân, Hải Phòng', NOW() + INTERVAL '4 hours', trucking_xyz_id, cosco_id,
      'AVAILABLE', true, 20.8449, 106.6881, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'COSU5678901', '40GP', container_type_40gp_id, cargo_type_general_id, hanoi_city_id, depot_hanoi_id,
      'Depot Văn Điển, Thanh Trì, Hà Nội', NOW() + INTERVAL '5 hours', trucking_xyz_id, cosco_id,
      'AVAILABLE', true, 20.9527, 105.8492, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'COSU6789012', '45HC', container_type_45hc_id, cargo_type_electronics_id, hcm_city_id, depot_hcm_id,
      'ICD Phước Long, Quận 9, TP.HCM', NOW() + INTERVAL '6 hours', trucking_xyz_id, cosco_id,
      'AVAILABLE', true, 10.8372, 106.7716, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW());
     
         -- Company DEF containers
     INSERT INTO import_containers (
         id, container_number, container_type, container_type_id, cargo_type_id, city_id, depot_id,
         drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id,
         status, is_listed_on_marketplace, latitude, longitude, condition_images, attached_documents, created_at
     ) VALUES
     (gen_random_uuid(), 'EGHU7890123', '20GP', container_type_20gp_id, cargo_type_textiles_id, hcm_city_id, depot_hcm_id,
      'Cảng Hiệp Phước, Quận 7, TP.HCM', NOW() + INTERVAL '7 hours', trucking_def_id, evergreen_id,
      'AVAILABLE', true, 10.6740, 106.6920, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'EGHU8901234', '40HC', container_type_40hc_id, cargo_type_machinery_id, danang_city_id, depot_danang_id,
      'Depot Liên Chiểu, Quận Liên Chiểu, Đà Nẵng', NOW() + INTERVAL '8 hours', trucking_def_id, evergreen_id,
      'AVAILABLE', true, 16.0838, 108.1495, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'EGHU9012345', '40GP', container_type_40gp_id, cargo_type_general_id, haiphong_city_id, depot_haiphong_id,
      'Cảng Đình Vũ, Quận Hải An, Hải Phòng', NOW() + INTERVAL '9 hours', trucking_def_id, evergreen_id,
      'AVAILABLE', true, 20.7831, 106.7967, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW());
     
         -- Company GHI containers
     INSERT INTO import_containers (
         id, container_number, container_type, container_type_id, cargo_type_id, city_id, depot_id,
         drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id,
         status, is_listed_on_marketplace, latitude, longitude, condition_images, attached_documents, created_at
     ) VALUES
     (gen_random_uuid(), 'MSCU0123456', '20GP', container_type_20gp_id, cargo_type_electronics_id, hanoi_city_id, depot_hanoi_id,
      'Cảng Nội Bài, Sóc Sơn, Hà Nội', NOW() + INTERVAL '10 hours', trucking_ghi_id, msc_id,
      'AVAILABLE', true, 21.2187, 105.8076, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'MSCU1234567', '40GP', container_type_40gp_id, cargo_type_textiles_id, hcm_city_id, depot_hcm_id,
      'ICD Tân Thuận, Quận 7, TP.HCM', NOW() + INTERVAL '11 hours', trucking_ghi_id, msc_id,
      'AVAILABLE', true, 10.7372, 106.7053, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'MSCU2345678', '45HC', container_type_45hc_id, cargo_type_machinery_id, danang_city_id, depot_danang_id,
      'Cảng Tiên Sa, Quận Sơn Trà, Đà Nẵng', NOW() + INTERVAL '12 hours', trucking_ghi_id, msc_id,
      'AVAILABLE', true, 16.1063, 108.2277, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW());
     
         -- Company JKL containers
     INSERT INTO import_containers (
         id, container_number, container_type, container_type_id, cargo_type_id, city_id, depot_id,
         drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id,
         status, is_listed_on_marketplace, latitude, longitude, condition_images, attached_documents, created_at
     ) VALUES
     (gen_random_uuid(), 'OOLU3456789', '20GP', container_type_20gp_id, cargo_type_general_id, haiphong_city_id, depot_haiphong_id,
      'Cảng Cửa Lò, Nghệ An', NOW() + INTERVAL '13 hours', trucking_jkl_id, oocl_id,
      'AVAILABLE', true, 18.8142, 105.7215, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'OOLU4567890', '40HC', container_type_40hc_id, cargo_type_electronics_id, hcm_city_id, depot_hcm_id,
      'Depot Phú Mỹ Hưng, Quận 7, TP.HCM', NOW() + INTERVAL '14 hours', trucking_jkl_id, oocl_id,
      'AVAILABLE', true, 10.7215, 106.6980, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW()),
     (gen_random_uuid(), 'OOLU5678901', '40GP', container_type_40gp_id, cargo_type_textiles_id, hanoi_city_id, depot_hanoi_id,
      'Depot Gia Lâm, Quận Gia Lâm, Hà Nội', NOW() + INTERVAL '15 hours', trucking_jkl_id, oocl_id,
      'AVAILABLE', true, 21.0285, 105.8542, ARRAY[]::TEXT[], ARRAY[]::TEXT[], NOW());

    -- Debug information
    RAISE NOTICE 'Container Type IDs: 20GP=%, 40GP=%, 40HC=%, 45HC=%', 
                 container_type_20gp_id, container_type_40gp_id, container_type_40hc_id, container_type_45hc_id;
    RAISE NOTICE 'Cargo Type IDs: General=%, Electronics=%, Textiles=%, Machinery=%', 
                 cargo_type_general_id, cargo_type_electronics_id, cargo_type_textiles_id, cargo_type_machinery_id;
    RAISE NOTICE 'City IDs: HCM=%, Hanoi=%, Haiphong=%, Danang=%', 
                 hcm_city_id, hanoi_city_id, haiphong_city_id, danang_city_id;
    RAISE NOTICE 'Depot IDs: HCM=%, Hanoi=%, Haiphong=%, Danang=%', 
                 depot_hcm_id, depot_hanoi_id, depot_haiphong_id, depot_danang_id;
    RAISE NOTICE 'Trucking Company IDs: ABC=%, XYZ=%, DEF=%, GHI=%, JKL=%', 
                 trucking_abc_id, trucking_xyz_id, trucking_def_id, trucking_ghi_id, trucking_jkl_id;
    RAISE NOTICE 'Shipping Line IDs: Maersk=%, COSCO=%, Evergreen=%, MSC=%, OOCL=%', 
                 maersk_id, cosco_id, evergreen_id, msc_id, oocl_id;

    RAISE NOTICE 'Successfully created marketplace sample data with % containers across % companies', 
                 (SELECT COUNT(*) FROM import_containers WHERE is_listed_on_marketplace = true), 
                 (SELECT COUNT(*) FROM organizations WHERE type = 'TRUCKING_COMPANY');
END $$;

COMMIT;

-- Verify the created data
SELECT 
    ic.container_number,
    ic.container_type,
    ic.drop_off_location,
    ic.available_from_datetime,
    tc.name as trucking_company,
    sl.name as shipping_line,
    ic.is_listed_on_marketplace
FROM import_containers ic
JOIN organizations tc ON ic.trucking_company_org_id = tc.id
JOIN organizations sl ON ic.shipping_line_org_id = sl.id
WHERE ic.is_listed_on_marketplace = true
ORDER BY ic.created_at DESC; 