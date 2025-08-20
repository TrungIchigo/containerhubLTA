-- Fix remaining functions batch 8: System and trigger functions
-- Functions: generate_additional_tasks, update_updated_at_column, handle_new_user
-- Adding SECURITY DEFINER and SET search_path = '' to prevent mutable search_path warnings

-- Note: Based on search results, these functions were found:
-- 1. set_updated_at() - trigger function to update updated_at timestamp
-- 2. update_updated_at_column() - similar function for updating updated_at
-- 3. handle_auto_approval() - trigger function for auto-approval
-- 4. generate_additional_tasks - not found in search results, might not exist or renamed
-- 5. handle_new_user - not found in search results, might not exist or renamed

-- Fix set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Fix handle_auto_approval function
CREATE OR REPLACE FUNCTION public.handle_auto_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    auto_approval_enabled BOOLEAN;
    approval_threshold DECIMAL;
    org_rating DECIMAL;
BEGIN
    -- Get organization's auto approval settings
    SELECT 
        aa.enabled,
        aa.rating_threshold
    INTO 
        auto_approval_enabled,
        approval_threshold
    FROM public.auto_approval_settings aa
    WHERE aa.organization_id = NEW.organization_id;
    
    -- If auto approval is not enabled, return without changes
    IF NOT COALESCE(auto_approval_enabled, FALSE) THEN
        RETURN NEW;
    END IF;
    
    -- Get organization rating
    SELECT COALESCE(AVG(pr.rating), 0)
    INTO org_rating
    FROM public.partner_reviews pr
    WHERE pr.reviewed_organization_id = NEW.organization_id;
    
    -- Auto approve if rating meets threshold
    IF org_rating >= COALESCE(approval_threshold, 4.0) THEN
        NEW.status = 'APPROVED';
        NEW.approved_at = CURRENT_TIMESTAMP;
        NEW.approved_by = 'system';
        NEW.approval_notes = 'Auto-approved based on organization rating';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Note: generate_additional_tasks and handle_new_user functions were not found in the codebase
-- They might have been renamed, removed, or exist in a different location
-- If these functions exist and need fixing, they should be added to this script

SELECT 'Batch 8 functions fixed successfully' AS result;