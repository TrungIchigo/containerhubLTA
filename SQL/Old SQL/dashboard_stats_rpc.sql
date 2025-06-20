-- Dashboard Statistics RPC Function
-- This function calculates KPIs for the dashboard based on organization and date range

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
        -- For dispatchers: requests they created
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
        WHERE requesting_org_id = org_id
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
        WHERE carrier_org_id = org_id
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

-- Function to get daily trend data for charts
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
        -- For dispatchers
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
            WHERE requesting_org_id = org_id
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
        WHERE requesting_org_id = org_id
          AND created_at::DATE >= start_date
          AND created_at::DATE <= end_date;
          
    ELSIF org_role = 'SHIPPING_LINE' THEN
        -- For carrier admins
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
            WHERE carrier_org_id = org_id
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
        WHERE carrier_org_id = org_id
          AND created_at::DATE >= start_date
          AND created_at::DATE <= end_date;
    END IF;
    
    -- Build result
    result := json_build_object(
        'trend_data', COALESCE(trend_data, '[]'::json),
        'status_distribution', COALESCE(status_distribution, '{}'::json),
        'date_range', json_build_object(
            'start_date', start_date,
            'end_date', end_date
        )
    );
    
    RETURN result;
END;
$$; 