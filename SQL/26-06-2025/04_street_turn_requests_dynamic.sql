-- ============================================================================
-- 04. STREET TURN REQUESTS (Dynamic)
-- Created: 26-06-2025
-- Purpose: Create 10 street turn requests using dynamic organization lookup
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
    -- Get organization IDs by name (LTA Admin is a TRUCKING_COMPANY with CARRIER_ADMIN role)
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
    -- Insert 10 Street Turn Requests using actual container and booking IDs
    -- ============================================================================
    WITH container_booking_pairs AS (
        SELECT 
            ic.id as import_container_id,
            eb.id as export_booking_id,
            ic.trucking_company_org_id as dropoff_org,
            eb.trucking_company_org_id as pickup_org,
            ROW_NUMBER() OVER (ORDER BY ic.created_at, eb.created_at) as pair_num
        FROM import_containers ic
        CROSS JOIN export_bookings eb
        WHERE ic.container_number LIKE 'NEWU26060%' 
        AND eb.booking_number LIKE 'LLRV2406%'
        LIMIT 10
    )
    INSERT INTO street_turn_requests (
        import_container_id, export_booking_id, dropoff_trucking_org_id, pickup_trucking_org_id,
        approving_org_id, status, match_type, estimated_cost_saving, estimated_co2_saving_kg, created_at, updated_at
    )
    SELECT 
        import_container_id,
        export_booking_id,
        dropoff_org,
        pickup_org,
        lta_org_id as approving_org_id,
        CASE 
            WHEN pair_num <= 5 THEN 'APPROVED'::request_status
            ELSE 'PENDING'::request_status
        END as status,
        CASE 
            WHEN dropoff_org = pickup_org THEN 'INTERNAL'::match_type
            ELSE 'MARKETPLACE'::match_type
        END as match_type,
        (2000000 + (pair_num * 300000))::NUMERIC as estimated_cost_saving,
        (120 + (pair_num * 20))::NUMERIC as estimated_co2_saving_kg,
        ('2025-06-26 10:00:00+07'::TIMESTAMPTZ + (pair_num || ' hours')::INTERVAL) as created_at,
        CASE 
            WHEN pair_num <= 5 THEN ('2025-06-26 16:00:00+07'::TIMESTAMPTZ + (pair_num || ' hours')::INTERVAL)
            ELSE ('2025-06-27 08:00:00+07'::TIMESTAMPTZ + (pair_num || ' hours')::INTERVAL)
        END as updated_at
    FROM container_booking_pairs;

    RAISE NOTICE 'Successfully inserted 10 street turn requests';
END $$; 