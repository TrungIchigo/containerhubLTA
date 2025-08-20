-- =====================================================
-- FIX REMAINING FUNCTIONS BATCH 2 - SEARCH PATH SECURITY
-- File: fix_remaining_functions_batch2.sql
-- Purpose: Fix mutable search_path warnings for batch 2 functions
-- Date: 19-06-2025
-- Functions: update_cod_request_status, get_org_rating_details
-- Note: fix_cod_request_eb32874b appears to not exist in current codebase
-- =====================================================

-- 1. Fix update_cod_request_status function
CREATE OR REPLACE FUNCTION public.update_cod_request_status(
    p_request_id UUID,
    p_new_status public.cod_request_status,
    p_actor_user_id UUID DEFAULT NULL,
    p_actor_org_name TEXT DEFAULT 'SYSTEM',
    p_details JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    old_status public.cod_request_status;
    timestamp_column TEXT;
    audit_action public.audit_log_action;
BEGIN
    -- Lấy trạng thái hiện tại
    SELECT status INTO old_status 
    FROM public.cod_requests 
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'COD request not found: %', p_request_id;
    END IF;
    
    -- Xác định cột timestamp và audit action
    CASE p_new_status
        WHEN 'APPROVED' THEN 
            timestamp_column := 'approved_at';
            audit_action := 'APPROVED';
        WHEN 'DECLINED' THEN
            timestamp_column := 'declined_at'; 
            audit_action := 'DECLINED';
        WHEN 'PENDING_PAYMENT' THEN
            timestamp_column := 'delivery_confirmed_at';
            audit_action := 'DELIVERY_CONFIRMED';
        WHEN 'PAID' THEN
            timestamp_column := 'payment_confirmed_at';
            audit_action := 'PAYMENT_CONFIRMED';
        WHEN 'PROCESSING_AT_DEPOT' THEN
            timestamp_column := 'depot_processing_started_at';
            audit_action := 'DEPOT_PROCESSING_STARTED';
        WHEN 'COMPLETED' THEN
            timestamp_column := 'completed_at';
            audit_action := 'COMPLETED';
        ELSE 
            timestamp_column := NULL;
            audit_action := p_new_status::TEXT::public.audit_log_action;
    END CASE;
    
    -- Cập nhật trạng thái
    IF timestamp_column IS NOT NULL THEN
        EXECUTE format('UPDATE public.cod_requests SET status = $1, %I = NOW() WHERE id = $2', timestamp_column)
        USING p_new_status, p_request_id;
    ELSE
        UPDATE public.cod_requests SET status = p_new_status WHERE id = p_request_id;
    END IF;
    
    -- Ghi audit log
    INSERT INTO public.cod_audit_logs (request_id, actor_user_id, actor_org_name, action, details)
    VALUES (p_request_id, p_actor_user_id, p_actor_org_name, audit_action, 
            COALESCE(p_details, jsonb_build_object(
                'old_status', old_status,
                'new_status', p_new_status,
                'timestamp', NOW()
            )));
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update COD request status: %', SQLERRM;
END;
$$;

-- 2. Fix get_org_rating_details function
CREATE OR REPLACE FUNCTION public.get_org_rating_details(org_id UUID)
RETURNS jsonb 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'average_rating', COALESCE(AVG(rating), 0),
            'review_count', COUNT(id)
        )
        FROM public.partner_reviews
        WHERE reviewee_org_id = org_id
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_cod_request_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_cod_request_status TO service_role;
GRANT EXECUTE ON FUNCTION public.get_org_rating_details TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_rating_details TO service_role;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '=== BATCH 2 FUNCTION SECURITY FIXES COMPLETED ==='; 
    RAISE NOTICE 'Fixed functions:';
    RAISE NOTICE '- public.update_cod_request_status: Added SECURITY DEFINER and SET search_path = '''''; 
    RAISE NOTICE '- public.get_org_rating_details: Added SECURITY DEFINER and SET search_path = '''''; 
    RAISE NOTICE 'Note: fix_cod_request_eb32874b function not found in current codebase';
END $$;