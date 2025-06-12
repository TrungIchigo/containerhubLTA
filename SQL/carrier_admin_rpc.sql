-- =====================================================
-- RPC FUNCTION FOR CARRIER ADMIN - OPTIMIZED QUERY
-- =====================================================
-- This function optimizes data fetching for carrier admin dashboard

-- Drop function if exists
DROP FUNCTION IF EXISTS get_carrier_pending_requests(UUID);

-- Create optimized function for carrier admin
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
    
  FROM street_turn_requests str
  JOIN import_containers ic ON str.import_container_id = ic.id
  JOIN export_bookings eb ON str.export_booking_id = eb.id
  JOIN organizations org ON str.requesting_org_id = org.id
  
  WHERE str.approving_org_id = carrier_org_id
    AND str.status = 'PENDING'
  
  ORDER BY str.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_carrier_pending_requests(UUID) TO authenticated;

-- Usage example:
-- SELECT * FROM get_carrier_pending_requests('your-shipping-line-org-id');

-- =====================================================
-- ADDITIONAL KPI FUNCTIONS FOR CARRIER ADMIN
-- =====================================================

-- Function to get KPI data for carrier admin
CREATE OR REPLACE FUNCTION get_carrier_kpis(carrier_org_id UUID)
RETURNS TABLE (
  pending_count BIGINT,
  approved_this_month BIGINT,
  total_approved BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_of_month TIMESTAMPTZ;
BEGIN
  -- Calculate start of current month
  start_of_month := date_trunc('month', NOW());
  
  RETURN QUERY
  SELECT 
    -- Pending requests count
    (SELECT COUNT(*) FROM street_turn_requests 
     WHERE approving_org_id = carrier_org_id AND status = 'PENDING') AS pending_count,
    
    -- Approved this month
    (SELECT COUNT(*) FROM street_turn_requests 
     WHERE approving_org_id = carrier_org_id 
       AND status = 'APPROVED' 
       AND created_at >= start_of_month) AS approved_this_month,
    
    -- Total approved (all time)
    (SELECT COUNT(*) FROM street_turn_requests 
     WHERE approving_org_id = carrier_org_id 
       AND status = 'APPROVED') AS total_approved;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_carrier_kpis(UUID) TO authenticated;

-- Usage example:
-- SELECT * FROM get_carrier_kpis('your-shipping-line-org-id');

-- =====================================================
-- COMBINED DASHBOARD FUNCTION
-- =====================================================

-- Single function to get all carrier dashboard data
CREATE OR REPLACE FUNCTION get_carrier_dashboard_data(carrier_org_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(kpis) FROM get_carrier_kpis(carrier_org_id) kpis),
    'pending_requests', (
      SELECT json_agg(row_to_json(requests))
      FROM get_carrier_pending_requests(carrier_org_id) requests
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_carrier_dashboard_data(UUID) TO authenticated;

-- Usage example:
-- SELECT get_carrier_dashboard_data('your-shipping-line-org-id'); 