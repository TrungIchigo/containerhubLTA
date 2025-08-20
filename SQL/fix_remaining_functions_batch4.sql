-- =====================================================
-- FIX REMAINING FUNCTIONS BATCH 4: CARRIER ADMIN FUNCTIONS
-- =====================================================
-- Fix functions: get_carrier_pending_requests, get_carrier_dashboard_data
-- Note: get_carrier_admin_requests was not found in the codebase

-- Fix get_carrier_pending_requests function
CREATE OR REPLACE FUNCTION get_carrier_pending_requests(carrier_org_id UUID)
RETURNS TABLE (
  request_id UUID,
  request_created_at TIMESTAMPTZ,
  estimated_cost_saving NUMERIC,
  estimated_co2_saving_kg NUMERIC,
  
  -- Container info
  container_id UUID,
  container_number TEXT,
  container_type TEXT,
  drop_off_location TEXT,
  available_from_datetime TIMESTAMPTZ,
  
  -- Booking info  
  booking_id UUID,
  booking_number TEXT,
  required_container_type TEXT,
  pick_up_location TEXT,
  needed_by_datetime TIMESTAMPTZ,
  
  -- Requesting company info
  requesting_company_id UUID,
  requesting_company_name TEXT,
  requesting_company_type organization_type
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    str.id AS request_id,
    str.created_at AS request_created_at,
    str.estimated_cost_saving,
    str.estimated_co2_saving_kg,
    
    -- Container details
    ic.id AS container_id,
    ic.container_number,
    ic.container_type,
    ic.drop_off_location,
    ic.available_from_datetime,
    
    -- Booking details
    eb.id AS booking_id,
    eb.booking_number,
    eb.required_container_type,
    eb.pick_up_location,
    eb.needed_by_datetime,
    
    -- Requesting company details
    org.id AS requesting_company_id,
    org.name AS requesting_company_name,
    org.type AS requesting_company_type
    
  FROM public.street_turn_requests str
  JOIN public.import_containers ic ON str.import_container_id = ic.id
  JOIN public.export_bookings eb ON str.export_booking_id = eb.id
  JOIN public.organizations org ON str.requesting_org_id = org.id
  
  WHERE str.approving_org_id = carrier_org_id
    AND str.status = 'PENDING'
  
  ORDER BY str.created_at DESC;
END;
$$;

-- Fix get_carrier_dashboard_data function
CREATE OR REPLACE FUNCTION get_carrier_dashboard_data(carrier_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(kpis) FROM public.get_carrier_kpis(carrier_org_id) kpis),
    'pending_requests', (
      SELECT json_agg(row_to_json(requests))
      FROM public.get_carrier_pending_requests(carrier_org_id) requests
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Note: get_carrier_kpis function was already fixed in previous batches or doesn't have mutable search_path warning

COMMIT;