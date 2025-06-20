-- =====================================================
-- COD MODULE - Cron Job Setup Script
-- Purpose: Setup automated expiration for COD requests
-- Run this script in Supabase SQL Editor after enabling pg_cron extension
-- =====================================================

-- Step 1: Verify pg_cron extension is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        RAISE EXCEPTION 'pg_cron extension is not enabled. Please enable it first in Supabase Dashboard > Database > Extensions';
    ELSE
        RAISE NOTICE 'pg_cron extension is enabled ✓';
    END IF;
END $$;

-- Step 2: Verify expire_old_cod_requests function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'expire_old_cod_requests'
    ) THEN
        RAISE EXCEPTION 'expire_old_cod_requests function does not exist. Please run expire_old_cod_requests.sql first';
    ELSE
        RAISE NOTICE 'expire_old_cod_requests function exists ✓';
    END IF;
END $$;

-- Step 3: Remove existing cron job if exists (for re-deployment)
SELECT cron.unschedule('expire-cod-requests') 
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'expire-cod-requests'
);

-- Step 4: Create new cron job
SELECT cron.schedule(
    'expire-cod-requests',                    -- Job name
    '0 * * * *',                             -- Every hour at minute 0
    'SELECT expire_old_cod_requests();'       -- Command to execute
);

-- Step 5: Verify cron job was created successfully
DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count 
    FROM cron.job 
    WHERE jobname = 'expire-cod-requests';
    
    IF job_count = 1 THEN
        RAISE NOTICE 'Cron job "expire-cod-requests" created successfully ✓';
        RAISE NOTICE 'Schedule: Every hour at minute 0 (0 * * * *)';
        RAISE NOTICE 'Command: SELECT expire_old_cod_requests();';
    ELSE
        RAISE EXCEPTION 'Failed to create cron job';
    END IF;
END $$;

-- Step 6: Display cron job details
SELECT 
    jobid,
    jobname,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job 
WHERE jobname = 'expire-cod-requests';

-- =====================================================
-- OPTIONAL: Test the setup
-- =====================================================

-- Test 1: Run the function manually to verify it works
-- SELECT * FROM expire_old_cod_requests();

-- Test 2: Check if there are any COD requests that will expire soon
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
    AND cr.expires_at IS NOT NULL
    AND cr.expires_at < NOW() + INTERVAL '2 hours'
ORDER BY cr.expires_at ASC;
*/

-- =====================================================
-- MONITORING QUERIES
-- =====================================================

-- Query 1: Check cron job execution history
/*
SELECT 
    runid,
    job_pid,
    status,
    return_message,
    start_time,
    end_time,
    end_time - start_time as duration
FROM cron.job_run_details 
WHERE jobid = (
    SELECT jobid FROM cron.job WHERE jobname = 'expire-cod-requests'
)
ORDER BY start_time DESC 
LIMIT 10;
*/

-- Query 2: Check recently expired COD requests
/*
SELECT 
    cr.id,
    cr.status,
    cr.expires_at,
    cr.updated_at,
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

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 COD Auto Expiration Setup Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Cron job will run every hour';
    RAISE NOTICE '✅ Expired COD requests will be automatically processed';
    RAISE NOTICE '✅ Container statuses will be rolled back to AVAILABLE';
    RAISE NOTICE '✅ Audit logs will be created for all expiration actions';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Use the monitoring queries above to track the system';
    RAISE NOTICE '🛠️ Refer to SUPABASE_CRON_SETUP.md for management instructions';
    RAISE NOTICE '';
END $$; 