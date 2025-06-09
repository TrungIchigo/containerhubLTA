-- Sample data for testing Dispatcher Dashboard

-- First, enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sample Organizations (using gen_random_uuid() for proper UUID format)
INSERT INTO organizations (id, name, type) VALUES 
  (gen_random_uuid(), 'Công ty Vận tải Toàn Thắng', 'TRUCKING_COMPANY'),
  (gen_random_uuid(), 'Công ty Vận tải Hùng Vương', 'TRUCKING_COMPANY'),
  (gen_random_uuid(), 'Hãng tàu COSCO', 'SHIPPING_LINE'),
  (gen_random_uuid(), 'Hãng tàu Maersk', 'SHIPPING_LINE');

-- Get the organization IDs for reference
-- Note: In a real scenario, you would query these IDs first
-- For testing, we'll use variables

DO $$
DECLARE
    trucking_1_id UUID;
    trucking_2_id UUID;
    shipping_1_id UUID;
    shipping_2_id UUID;
    container_1_id UUID;
    container_2_id UUID;
    container_3_id UUID;
    container_4_id UUID;
    booking_1_id UUID;
    booking_2_id UUID;
    booking_3_id UUID;
    booking_4_id UUID;
BEGIN
    -- Get organization IDs
    SELECT id INTO trucking_1_id FROM organizations WHERE name = 'Công ty Vận tải Toàn Thắng';
    SELECT id INTO trucking_2_id FROM organizations WHERE name = 'Công ty Vận tải Hùng Vương';
    SELECT id INTO shipping_1_id FROM organizations WHERE name = 'Hãng tàu COSCO';
    SELECT id INTO shipping_2_id FROM organizations WHERE name = 'Hãng tàu Maersk';

    -- Insert import containers with proper UUIDs
    INSERT INTO import_containers (id, container_number, container_type, drop_off_location, available_from_datetime, trucking_company_org_id, shipping_line_org_id, status) VALUES 
      (gen_random_uuid(), 'COSU1234567', '20FT', 'Cảng Cát Lái, TP.HCM', '2024-12-01 08:00:00', trucking_1_id, shipping_1_id, 'AVAILABLE'),
      (gen_random_uuid(), 'MSKU2345678', '40FT', 'Cảng Cát Lái, TP.HCM', '2024-12-02 10:00:00', trucking_1_id, shipping_2_id, 'AVAILABLE'),
      (gen_random_uuid(), 'COSU3456789', '40HQ', 'Cảng Hiệp Phước, TP.HCM', '2024-12-03 14:00:00', trucking_1_id, shipping_1_id, 'AWAITING_APPROVAL'),
      (gen_random_uuid(), 'MSKU4567890', '20FT', 'Cảng Tân Cảng, TP.HCM', '2024-12-04 09:00:00', trucking_2_id, shipping_2_id, 'AVAILABLE');

    -- Insert export bookings with proper UUIDs
    INSERT INTO export_bookings (id, booking_number, required_container_type, pick_up_location, needed_by_datetime, trucking_company_org_id, status) VALUES 
      (gen_random_uuid(), 'BKG123456789', '20FT', 'Khu Công nghiệp Tân Thuận, TP.HCM', '2024-12-05 16:00:00', trucking_1_id, 'AVAILABLE'),
      (gen_random_uuid(), 'BKG234567890', '40FT', 'Khu Công nghiệp Hiệp Phước, TP.HCM', '2024-12-06 12:00:00', trucking_1_id, 'AVAILABLE'),
      (gen_random_uuid(), 'BKG345678901', '40HQ', 'Khu Công nghiệp Cát Lái, TP.HCM', '2024-12-07 10:00:00', trucking_1_id, 'AWAITING_APPROVAL'),
      (gen_random_uuid(), 'BKG456789012', '20FT', 'Khu Công nghiệp Long Bình, TP.HCM', '2024-12-08 14:00:00', trucking_2_id, 'AVAILABLE');

    -- Get container and booking IDs for street turn requests
    SELECT id INTO container_3_id FROM import_containers WHERE container_number = 'COSU3456789';
    SELECT id INTO container_1_id FROM import_containers WHERE container_number = 'COSU1234567';
    SELECT id INTO booking_3_id FROM export_bookings WHERE booking_number = 'BKG345678901';
    SELECT id INTO booking_1_id FROM export_bookings WHERE booking_number = 'BKG123456789';

    -- Insert street turn requests with proper UUIDs
    INSERT INTO street_turn_requests (id, import_container_id, export_booking_id, requesting_org_id, approving_org_id, status, estimated_cost_saving, estimated_co2_saving_kg) VALUES 
      (gen_random_uuid(), container_3_id, booking_3_id, trucking_1_id, shipping_1_id, 'APPROVED', 450, 85),
      (gen_random_uuid(), container_1_id, booking_1_id, trucking_1_id, shipping_1_id, 'PENDING', 320, 65);
END $$;

-- Instructions for testing:
-- 1. Run this script in your Supabase SQL Editor
-- 2. To test as a dispatcher from 'Công ty Vận tải Toàn Thắng':
--    - Register an account and select organization 'Công ty Vận tái Toàn Thắng' with role 'DISPATCHER'
-- 3. To test as a dispatcher from 'Công ty Vận tải Hùng Vương': 
--    - Register an account and select organization 'Công ty Vận tái Hùng Vương' with role 'DISPATCHER'
-- 4. To test as a carrier admin:
--    - Register an account and select 'Hãng tàu COSCO' or 'Hãng tàu Maersk' with role 'CARRIER_ADMIN'

-- Query to check the data was inserted correctly:
-- SELECT o.name, o.type FROM organizations o ORDER BY o.type, o.name;
-- SELECT ic.container_number, o1.name as trucking, o2.name as shipping FROM import_containers ic
-- JOIN organizations o1 ON ic.trucking_company_org_id = o1.id
-- JOIN organizations o2 ON ic.shipping_line_org_id = o2.id; 