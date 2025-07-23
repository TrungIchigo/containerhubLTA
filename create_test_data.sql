-- Create sample test data for dispatcher dashboard
-- Run this in Supabase SQL Editor

-- First, ensure we have organizations
INSERT INTO organizations (name, type) VALUES 
  ('ABC Logistics', 'TRUCKING_COMPANY'),
  ('XYZ Transport', 'TRUCKING_COMPANY'),
  ('Maersk Line', 'SHIPPING_LINE'),
  ('MSC Line', 'SHIPPING_LINE')
ON CONFLICT (name) DO NOTHING;

-- Get organization IDs
DO $$
DECLARE
  abc_logistics_id UUID;
  xyz_transport_id UUID;
  maersk_id UUID;
  msc_id UUID;
BEGIN
  SELECT id INTO abc_logistics_id FROM organizations WHERE name = 'ABC Logistics';
  SELECT id INTO xyz_transport_id FROM organizations WHERE name = 'XYZ Transport';
  SELECT id INTO maersk_id FROM organizations WHERE name = 'Maersk Line';
  SELECT id INTO msc_id FROM organizations WHERE name = 'MSC Line';

  -- Insert sample import containers
  INSERT INTO import_containers (
    container_number, 
    container_type, 
    drop_off_location, 
    available_from_datetime, 
    trucking_company_org_id, 
    shipping_line_org_id, 
    status
  ) VALUES 
    ('MSKU1234567', '20FT', 'Cảng Cát Lái, TP.HCM', NOW() + INTERVAL '1 day', abc_logistics_id, maersk_id, 'AVAILABLE'),
    ('MSKU2345678', '40FT', 'Cảng Hiệp Phước, TP.HCM', NOW() + INTERVAL '2 days', abc_logistics_id, maersk_id, 'AVAILABLE'),
    ('MSCU3456789', '20FT', 'Depot Tân Thuận, TP.HCM', NOW() + INTERVAL '1 day', abc_logistics_id, msc_id, 'AVAILABLE'),
    ('MSCU4567890', '40FT', 'KCN Tân Tạo, TP.HCM', NOW() + INTERVAL '3 days', xyz_transport_id, msc_id, 'AVAILABLE')
  ON CONFLICT (container_number) DO NOTHING;

  -- Insert sample export bookings
  INSERT INTO export_bookings (
    booking_number, 
    required_container_type, 
    pick_up_location, 
    needed_by_datetime, 
    trucking_company_org_id, 
    status
  ) VALUES 
    ('BKG-ABC-001', '20FT', 'KCN Sóng Thần, Bình Dương', NOW() + INTERVAL '2 days', abc_logistics_id, 'AVAILABLE'),
    ('BKG-ABC-002', '40FT', 'KCN Long Hậu, Long An', NOW() + INTERVAL '3 days', abc_logistics_id, 'AVAILABLE'),
    ('BKG-ABC-003', '20FT', 'Cảng ICD Đồng Nai', NOW() + INTERVAL '1 day', abc_logistics_id, 'AVAILABLE'),
    ('BKG-XYZ-001', '40FT', 'KCN Đồng An, Bình Dương', NOW() + INTERVAL '4 days', xyz_transport_id, 'AVAILABLE')
  ON CONFLICT (booking_number) DO NOTHING;

  RAISE NOTICE 'Test data created successfully with organization IDs: ABC=%, XYZ=%, Maersk=%, MSC=%', 
    abc_logistics_id, xyz_transport_id, maersk_id, msc_id;
END $$;

-- 2. Check if we have data
SELECT 
    'Import Containers' as table_name,
    COUNT(*) as record_count
FROM import_containers
UNION ALL
SELECT 
    'Export Bookings' as table_name,
    COUNT(*) as record_count  
FROM export_bookings
UNION ALL
SELECT 
    'Organizations' as table_name,
    COUNT(*) as record_count
FROM organizations; 
