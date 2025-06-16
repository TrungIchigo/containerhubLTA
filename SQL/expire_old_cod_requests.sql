 -- =====================================================
-- COD MODULE - Auto Expiration Function
-- Function: expire_old_cod_requests()
-- Purpose: Automatically expire COD requests after 24 hours
-- Usage: Called by Supabase Cron Job every hour
-- =====================================================

-- Drop function if exists (for re-deployment)
DROP FUNCTION IF EXISTS expire_old_cod_requests();

-- Create the function to expire old COD requests
CREATE OR REPLACE FUNCTION expire_old_cod_requests()
RETURNS TABLE (
    expired_count INTEGER,
    expired_requests JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    expired_record RECORD;
    expired_list JSONB := '[]'::JSONB;
    total_expired INTEGER := 0;
BEGIN
    -- Log function start
    RAISE NOTICE 'Starting expire_old_cod_requests function at %', NOW();
    
    -- Find and process expired COD requests
    FOR expired_record IN
        SELECT 
            cr.id,
            cr.dropoff_order_id,
            cr.status,
            cr.expires_at,
            cr.requesting_org_id,
            cr.approving_org_id,
            ic.container_number,
            org.name as requesting_org_name
        FROM cod_requests cr
        LEFT JOIN import_containers ic ON cr.dropoff_order_id = ic.id
        LEFT JOIN organizations org ON cr.requesting_org_id = org.id
        WHERE 
            cr.status IN ('PENDING', 'AWAITING_INFO')
            AND cr.expires_at < NOW()
            AND cr.expires_at IS NOT NULL
        ORDER BY cr.expires_at ASC
    LOOP
        -- Update COD request status to EXPIRED
        UPDATE cod_requests 
        SET 
            status = 'EXPIRED',
            updated_at = NOW()
        WHERE id = expired_record.id;
        
        -- Rollback container status to AVAILABLE
        UPDATE import_containers 
        SET status = 'AVAILABLE'
        WHERE id = expired_record.dropoff_order_id;
        
        -- Insert audit log for expiration
        INSERT INTO cod_audit_logs (
            request_id,
            actor_user_id,
            actor_org_name,
            action,
            details,
            created_at
        ) VALUES (
            expired_record.id,
            NULL, -- System action, no specific user
            'SYSTEM',
            'EXPIRED',
            jsonb_build_object(
                'container_number', expired_record.container_number,
                'expired_at', expired_record.expires_at,
                'previous_status', expired_record.status,
                'requesting_org', expired_record.requesting_org_name,
                'reason', 'Automatically expired after 24 hours'
            ),
            NOW()
        );
        
        -- Add to expired list for return
        expired_list := expired_list || jsonb_build_object(
            'request_id', expired_record.id,
            'container_number', expired_record.container_number,
            'requesting_org', expired_record.requesting_org_name,
            'expired_at', expired_record.expires_at,
            'previous_status', expired_record.status
        );
        
        total_expired := total_expired + 1;
        
        -- Log each expired request
        RAISE NOTICE 'Expired COD request: % for container: % from org: %', 
            expired_record.id, 
            expired_record.container_number, 
            expired_record.requesting_org_name;
    END LOOP;
    
    -- Log completion
    RAISE NOTICE 'Completed expire_old_cod_requests function. Total expired: %', total_expired;
    
    -- Return results
    RETURN QUERY SELECT total_expired, expired_list;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION expire_old_cod_requests() IS 
'Automatically expires COD requests that have passed their 24-hour deadline. 
Updates request status to EXPIRED, rolls back container status to AVAILABLE, 
and logs the expiration action. Returns count and details of expired requests.';

-- Grant execute permission to authenticated users (for manual testing)
GRANT EXECUTE ON FUNCTION expire_old_cod_requests() TO authenticated;

-- Grant execute permission to service_role (for cron job)
GRANT EXECUTE ON FUNCTION expire_old_cod_requests() TO service_role;

-- Example usage (for testing):
-- SELECT * FROM expire_old_cod_requests();

-- =====================================================
-- TESTING QUERIES (Optional - for development)
-- =====================================================

-- Query to check requests that will expire soon (next 1 hour)
/*
SELECT 
    cr.id,
    cr.status,
    cr.expires_at,
    cr.expires_at - NOW() as time_remaining,
    ic.container_number,
    org.name as requesting_org
FROM cod_requests cr
LEFT JOIN import_containers ic ON cr.dropoff_order_id = ic.id
LEFT JOIN organizations org ON cr.requesting_org_id = org.id
WHERE 
    cr.status IN ('PENDING', 'AWAITING_INFO')
    AND cr.expires_at BETWEEN NOW() AND NOW() + INTERVAL '1 hour'
ORDER BY cr.expires_at ASC;
*/

-- Query to check recently expired requests
/*
SELECT 
    cr.id,
    cr.status,
    cr.expires_at,
    ic.container_number,
    org.name as requesting_org
FROM cod_requests cr
LEFT JOIN import_containers ic ON cr.dropoff_order_id = ic.id
LEFT JOIN organizations org ON cr.requesting_org_id = org.id
WHERE 
    cr.status = 'EXPIRED'
    AND cr.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY cr.updated_at DESC;
*/