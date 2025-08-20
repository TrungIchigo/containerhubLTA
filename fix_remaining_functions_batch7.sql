-- Fix Remaining Functions Batch 7: Marketplace and Validation Functions
-- This script fixes functions with mutable search_path warnings
-- Functions: get_marketplace_listings_with_rating, validate_shipping_line_type, fix_approved_cod_request

-- Fix get_marketplace_listings_with_rating function
-- This function returns marketplace listings filtered by minimum rating
CREATE OR REPLACE FUNCTION public.get_marketplace_listings_with_rating(
    min_rating_value NUMERIC DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    container_number VARCHAR,
    container_type VARCHAR,
    drop_off_location TEXT,
    available_from_datetime TIMESTAMPTZ,
    latitude NUMERIC,
    longitude NUMERIC,
    shipping_line_org_id UUID,
    trucking_company_org_id UUID,
    status VARCHAR,
    is_listed_on_marketplace BOOLEAN,
    created_at TIMESTAMPTZ,
    avg_rating NUMERIC,
    review_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ic.id,
        ic.container_number,
        ic.container_type,
        ic.drop_off_location,
        ic.available_from_datetime,
        ic.latitude,
        ic.longitude,
        ic.shipping_line_org_id,
        ic.trucking_company_org_id,
        ic.status,
        ic.is_listed_on_marketplace,
        ic.created_at,
        COALESCE(r.avg_rating, 0) as avg_rating,
        COALESCE(r.review_count, 0) as review_count
    FROM public.import_containers ic
    LEFT JOIN (
        SELECT 
            reviewee_org_id,
            AVG(rating) as avg_rating,
            COUNT(*) as review_count
        FROM public.partner_reviews
        GROUP BY reviewee_org_id
    ) r ON ic.trucking_company_org_id = r.reviewee_org_id
    WHERE 
        ic.is_listed_on_marketplace = true
        AND ic.status = 'AVAILABLE'
        AND COALESCE(r.avg_rating, 0) >= min_rating_value;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_marketplace_listings_with_rating(NUMERIC) IS 'Returns marketplace listings filtered by minimum rating. Fixed with SECURITY DEFINER and SET search_path = ''''.';

-- Fix validate_shipping_line_type function
-- This function validates if an organization is a shipping line
CREATE OR REPLACE FUNCTION public.validate_shipping_line_type(
    org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    org_type TEXT;
BEGIN
    SELECT type INTO org_type
    FROM public.organizations
    WHERE id = org_id;
    
    RETURN (org_type = 'SHIPPING_LINE');
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.validate_shipping_line_type(UUID) IS 'Validates if an organization is a shipping line. Fixed with SECURITY DEFINER and SET search_path = ''''.';

-- Note: fix_approved_cod_request function was not found in the current codebase
-- It may have been renamed to approve_cod_request or removed
-- The approve_cod_request function is already fixed in previous batches

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_marketplace_listings_with_rating TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketplace_listings_with_rating TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_shipping_line_type TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_shipping_line_type TO service_role;

-- Log completion
SELECT 
    'BATCH 7 FUNCTIONS FIXED' as status,
    'get_marketplace_listings_with_rating, validate_shipping_line_type' as functions_fixed,
    'fix_approved_cod_request not found in current codebase (may be renamed to approve_cod_request)' as note,
    NOW() as completed_at;