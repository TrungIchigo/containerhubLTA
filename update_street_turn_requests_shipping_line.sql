-- Update street_turn_requests related queries to include shipping line from export_bookings
-- This script updates views and functions that might need to access shipping line information

-- 1. Update any views that join export_bookings
-- Example: If you have a view for street turn requests with details

-- Drop existing view if it exists
DROP VIEW IF EXISTS street_turn_requests_with_details;

-- Create updated view with shipping line information
CREATE OR REPLACE VIEW street_turn_requests_with_details AS
SELECT 
  str.*,
  -- Import container details
  ic.container_number,
  ic.container_type as import_container_type,
  ic.drop_off_location as import_location,
  ic.available_from_datetime,
  ic.shipping_line_org_id as import_shipping_line_org_id,
  ic_shipping.name as import_shipping_line_name,
  
  -- Export booking details  
  eb.booking_number,
  eb.required_container_type as export_container_type,
  eb.pick_up_location as export_location,
  eb.needed_by_datetime,
  eb.shipping_line_org_id as export_shipping_line_org_id,
  eb_shipping.name as export_shipping_line_name,
  
  -- Organization details
  dropoff_org.name as dropoff_org_name,
  pickup_org.name as pickup_org_name,
  approving_org.name as approving_org_name

FROM street_turn_requests str
LEFT JOIN import_containers ic ON str.import_container_id = ic.id
LEFT JOIN export_bookings eb ON str.export_booking_id = eb.id
LEFT JOIN organizations ic_shipping ON ic.shipping_line_org_id = ic_shipping.id
LEFT JOIN organizations eb_shipping ON eb.shipping_line_org_id = eb_shipping.id
LEFT JOIN organizations dropoff_org ON str.dropoff_trucking_org_id = dropoff_org.id
LEFT JOIN organizations pickup_org ON str.pickup_trucking_org_id = pickup_org.id
LEFT JOIN organizations approving_org ON str.approving_org_id = approving_org.id;

-- 2. Grant permissions on the view
GRANT SELECT ON street_turn_requests_with_details TO authenticated;

-- 3. Update RLS policies for export_bookings in carrier admin context
-- This ensures carrier admins can see export bookings assigned to their shipping line

-- Update any functions that might need to check shipping line access
-- Example: Function to get requests for carrier admin

CREATE OR REPLACE FUNCTION get_carrier_admin_requests(admin_org_id UUID)
RETURNS TABLE (
  request_id UUID,
  request_status TEXT,
  container_number TEXT,
  booking_number TEXT,
  import_shipping_line TEXT,
  export_shipping_line TEXT,
  dropoff_org TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    str.id as request_id,
    str.status::TEXT as request_status,
    ic.container_number,
    eb.booking_number,
    ic_org.name as import_shipping_line,
    eb_org.name as export_shipping_line,
    dropoff_org.name as dropoff_org,
    str.created_at
  FROM street_turn_requests str
  LEFT JOIN import_containers ic ON str.import_container_id = ic.id
  LEFT JOIN export_bookings eb ON str.export_booking_id = eb.id
  LEFT JOIN organizations ic_org ON ic.shipping_line_org_id = ic_org.id
  LEFT JOIN organizations eb_org ON eb.shipping_line_org_id = eb_org.id
  LEFT JOIN organizations dropoff_org ON str.dropoff_trucking_org_id = dropoff_org.id
  WHERE 
    -- Carrier admin can see requests where their organization is involved
    (ic.shipping_line_org_id = admin_org_id OR eb.shipping_line_org_id = admin_org_id)
    AND str.status IN ('PENDING', 'AWAITING_INFO')
  ORDER BY str.created_at DESC;
END;
$$;

-- 4. Create function to check if shipping lines match for street turn optimization
CREATE OR REPLACE FUNCTION check_shipping_line_compatibility(
  import_container_id UUID,
  export_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  import_shipping_line UUID;
  export_shipping_line UUID;
BEGIN
  -- Get shipping lines for both container and booking
  SELECT shipping_line_org_id INTO import_shipping_line
  FROM import_containers 
  WHERE id = import_container_id;
  
  SELECT shipping_line_org_id INTO export_shipping_line
  FROM export_bookings 
  WHERE id = export_booking_id;
  
  -- Return true if both have shipping lines and they match
  -- Or if one or both don't have shipping lines (for backward compatibility)
  RETURN (
    import_shipping_line IS NULL OR 
    export_shipping_line IS NULL OR 
    import_shipping_line = export_shipping_line
  );
END;
$$;

-- 5. Update matching algorithm function to consider shipping line compatibility
CREATE OR REPLACE FUNCTION get_matching_suggestions(user_org_id UUID)
RETURNS TABLE (
  import_container_id UUID,
  export_booking_id UUID,
  container_number TEXT,
  booking_number TEXT,
  shipping_line_match BOOLEAN,
  estimated_savings NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ic.id as import_container_id,
    eb.id as export_booking_id,
    ic.container_number,
    eb.booking_number,
    check_shipping_line_compatibility(ic.id, eb.id) as shipping_line_match,
    -- Basic savings calculation (can be enhanced)
    100.0 as estimated_savings
  FROM import_containers ic
  CROSS JOIN export_bookings eb
  WHERE 
    ic.trucking_company_org_id = user_org_id
    AND eb.trucking_company_org_id = user_org_id
    AND ic.status = 'AVAILABLE'
    AND eb.status = 'AVAILABLE'
    AND ic.container_type = eb.required_container_type
    -- Prefer matches with same shipping line
  ORDER BY 
    check_shipping_line_compatibility(ic.id, eb.id) DESC,
    ic.created_at ASC
  LIMIT 10;
END;
$$;

-- 6. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_carrier_admin_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_shipping_line_compatibility(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_matching_suggestions(UUID) TO authenticated;

-- 7. Create index for better performance on shipping line queries
CREATE INDEX IF NOT EXISTS idx_export_bookings_shipping_line_status 
ON export_bookings(shipping_line_org_id, status);

CREATE INDEX IF NOT EXISTS idx_import_containers_shipping_line_status 
ON import_containers(shipping_line_org_id, status);

-- 8. Verify the updates
SELECT 
  'export_bookings' as table_name,
  COUNT(*) as total_records,
  COUNT(shipping_line_org_id) as records_with_shipping_line
FROM export_bookings
UNION ALL
SELECT 
  'import_containers' as table_name,
  COUNT(*) as total_records,
  COUNT(shipping_line_org_id) as records_with_shipping_line
FROM import_containers;

-- Show sample data with shipping lines
SELECT 
  eb.booking_number,
  eb.required_container_type,
  org.name as shipping_line_name,
  eb.status
FROM export_bookings eb
LEFT JOIN organizations org ON eb.shipping_line_org_id = org.id
WHERE org.type = 'SHIPPING_LINE' OR eb.shipping_line_org_id IS NULL
LIMIT 5; 