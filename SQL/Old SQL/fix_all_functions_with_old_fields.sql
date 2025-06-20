-- Fix all functions and RPC calls using old field names
-- Run this in Supabase SQL Editor

-- 1. Fix dashboard stats function
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    org_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_requests INTEGER := 0;
    approved_requests INTEGER := 0;
    declined_requests INTEGER := 0;
    pending_requests INTEGER := 0;
    total_cost_saving DECIMAL := 0;
    total_co2_saving DECIMAL := 0;
    approval_rate DECIMAL := 0;
    org_role TEXT;
BEGIN
    -- Get organization role
    SELECT type INTO org_role 
    FROM organizations 
    WHERE id = org_id;
    
    -- Set default date range if not provided (last 30 days)
    IF start_date IS NULL THEN
        start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF end_date IS NULL THEN
        end_date := CURRENT_DATE;
    END IF;
    
    -- Calculate KPIs based on organization role
    IF org_role = 'TRUCKING_COMPANY' THEN
        -- For dispatchers: requests they created (use new field)
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'APPROVED'),
            COUNT(*) FILTER (WHERE status = 'DECLINED'),
            COUNT(*) FILTER (WHERE status = 'PENDING'),
            COALESCE(SUM(estimated_cost_saving), 0),
            COALESCE(SUM(estimated_co2_saving_kg), 0)
        INTO 
            total_requests,
            approved_requests,
            declined_requests,
            pending_requests,
            total_cost_saving,
            total_co2_saving
        FROM street_turn_requests
        WHERE dropoff_trucking_org_id = org_id  -- CHANGED: was requesting_org_id
          AND created_at::DATE >= start_date
          AND created_at::DATE <= end_date;
          
    ELSIF org_role = 'SHIPPING_LINE' THEN
        -- For carrier admins: requests they received
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'APPROVED'),
            COUNT(*) FILTER (WHERE status = 'DECLINED'),
            COUNT(*) FILTER (WHERE status = 'PENDING'),
            COALESCE(SUM(estimated_cost_saving), 0),
            COALESCE(SUM(estimated_co2_saving_kg), 0)
        INTO 
            total_requests,
            approved_requests,
            declined_requests,
            pending_requests,
            total_cost_saving,
            total_co2_saving
        FROM street_turn_requests
        WHERE approving_org_id = org_id  -- CHANGED: was carrier_org_id
          AND created_at::DATE >= start_date
          AND created_at::DATE <= end_date;
    END IF;
    
    -- Calculate approval rate
    IF total_requests > 0 THEN
        approval_rate := ROUND((approved_requests::DECIMAL / total_requests::DECIMAL) * 100, 2);
    END IF;
    
    -- Build result JSON
    result := json_build_object(
        'summary', json_build_object(
            'total_cost_saving', total_cost_saving,
            'total_co2_saving', total_co2_saving,
            'successful_street_turns', approved_requests,
            'approval_rate', approval_rate,
            'total_requests', total_requests,
            'approved_requests', approved_requests,
            'declined_requests', declined_requests,
            'pending_requests', pending_requests
        ),
        'date_range', json_build_object(
            'start_date', start_date,
            'end_date', end_date
        ),
        'organization_role', org_role
    );
    
    RETURN result;
END;
$$;

-- 2. Fix dashboard trend data function
CREATE OR REPLACE FUNCTION get_dashboard_trend_data(
    org_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    org_role TEXT;
    trend_data JSON;
    status_distribution JSON;
BEGIN
    -- Get organization role
    SELECT type INTO org_role 
    FROM organizations 
    WHERE id = org_id;
    
    -- Set default date range if not provided (last 30 days)
    IF start_date IS NULL THEN
        start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF end_date IS NULL THEN
        end_date := CURRENT_DATE;
    END IF;
    
    -- Get daily trend data
    IF org_role = 'TRUCKING_COMPANY' THEN
        -- For dispatchers (use new field)
        SELECT json_agg(
            json_build_object(
                'date', date_series::DATE,
                'approved', COALESCE(daily_data.approved_count, 0),
                'declined', COALESCE(daily_data.declined_count, 0),
                'pending', COALESCE(daily_data.pending_count, 0),
                'total', COALESCE(daily_data.total_count, 0)
            ) ORDER BY date_series
        ) INTO trend_data
        FROM generate_series(start_date, end_date, '1 day'::interval) AS date_series
        LEFT JOIN (
            SELECT 
                created_at::DATE as request_date,
                COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
                COUNT(*) FILTER (WHERE status = 'DECLINED') as declined_count,
                COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
                COUNT(*) as total_count
            FROM street_turn_requests
            WHERE dropoff_trucking_org_id = org_id  -- CHANGED: was requesting_org_id
              AND created_at::DATE >= start_date
              AND created_at::DATE <= end_date
            GROUP BY created_at::DATE
        ) daily_data ON date_series::DATE = daily_data.request_date;
        
        -- Get status distribution
        SELECT json_build_object(
            'approved', COUNT(*) FILTER (WHERE status = 'APPROVED'),
            'declined', COUNT(*) FILTER (WHERE status = 'DECLINED'),
            'pending', COUNT(*) FILTER (WHERE status = 'PENDING')
        ) INTO status_distribution
        FROM street_turn_requests
        WHERE dropoff_trucking_org_id = org_id  -- CHANGED: was requesting_org_id
          AND created_at::DATE >= start_date
          AND created_at::DATE <= end_date;
          
    ELSIF org_role = 'SHIPPING_LINE' THEN
        -- For carrier admins (use correct field)
        SELECT json_agg(
            json_build_object(
                'date', date_series::DATE,
                'approved', COALESCE(daily_data.approved_count, 0),
                'declined', COALESCE(daily_data.declined_count, 0),
                'pending', COALESCE(daily_data.pending_count, 0),
                'total', COALESCE(daily_data.total_count, 0)
            ) ORDER BY date_series
        ) INTO trend_data
        FROM generate_series(start_date, end_date, '1 day'::interval) AS date_series
        LEFT JOIN (
            SELECT 
                created_at::DATE as request_date,
                COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
                COUNT(*) FILTER (WHERE status = 'DECLINED') as declined_count,
                COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
                COUNT(*) as total_count
            FROM street_turn_requests
            WHERE approving_org_id = org_id  -- CHANGED: was carrier_org_id
              AND created_at::DATE >= start_date
              AND created_at::DATE <= end_date
            GROUP BY created_at::DATE
        ) daily_data ON date_series::DATE = daily_data.request_date;
        
        -- Get status distribution
        SELECT json_build_object(
            'approved', COUNT(*) FILTER (WHERE status = 'APPROVED'),
            'declined', COUNT(*) FILTER (WHERE status = 'DECLINED'),
            'pending', COUNT(*) FILTER (WHERE status = 'PENDING')
        ) INTO status_distribution
        FROM street_turn_requests
        WHERE approving_org_id = org_id  -- CHANGED: was carrier_org_id
          AND created_at::DATE >= start_date
          AND created_at::DATE <= end_date;
    END IF;
    
    -- Build result
    result := json_build_object(
        'trend_data', trend_data,
        'status_distribution', status_distribution,
        'date_range', json_build_object(
            'start_date', start_date,
            'end_date', end_date
        ),
        'organization_role', org_role
    );
    
    RETURN result;
END;
$$;

-- 3. Fix carrier admin functions 
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
    
    -- Requesting company details (use new field)
    org.id AS requesting_company_id,
    org.name AS requesting_company_name,
    org.type AS requesting_company_type
    
  FROM street_turn_requests str
  JOIN import_containers ic ON str.import_container_id = ic.id
  JOIN export_bookings eb ON str.export_booking_id = eb.id
  JOIN organizations org ON str.dropoff_trucking_org_id = org.id  -- CHANGED: was requesting_org_id
  
  WHERE str.approving_org_id = carrier_org_id
    AND str.status = 'PENDING'
  
  ORDER BY str.created_at DESC;
END;
$$;

-- Grant permissions to all functions
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_trend_data(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_carrier_pending_requests(UUID) TO authenticated;

-- Verify functions were updated
SELECT 'Functions updated successfully' as result; 