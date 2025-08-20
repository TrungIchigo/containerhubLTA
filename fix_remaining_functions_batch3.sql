-- Fix Remaining Functions Batch 3: Location and Shipping Functions
-- This script fixes functions with mutable search_path warnings
-- Functions: sync_pickup_location_fields, get_shipping_lines_for_filter
-- Note: check_shipping_line_compatibility not found in codebase (may have been deleted)

-- Fix sync_pickup_location_fields function
-- This is a trigger function to synchronize pickup_location and pick_up_location fields
CREATE OR REPLACE FUNCTION public.sync_pickup_location_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- If pick_up_location is updated, sync to pickup_location
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.pickup_location = NEW.pick_up_location;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.sync_pickup_location_fields() IS 'Trigger function to synchronize pickup_location and pick_up_location fields in export_bookings table. Fixed with SECURITY DEFINER and SET search_path = ''''.';

-- Fix get_shipping_lines_for_filter function
-- This function returns shipping line organizations for filter combobox
CREATE OR REPLACE FUNCTION public.get_shipping_lines_for_filter()
RETURNS TABLE (
    id UUID,
    name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name
    FROM public.organizations o
    WHERE o.type = 'SHIPPING_LINE'
    ORDER BY o.name ASC;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_shipping_lines_for_filter() IS 'Returns shipping line organizations for filter combobox. Fixed with SECURITY DEFINER and SET search_path = ''''.';

-- Log completion
SELECT 
    'BATCH 3 FUNCTIONS FIXED' as status,
    'sync_pickup_location_fields, get_shipping_lines_for_filter' as functions_fixed,
    'check_shipping_line_compatibility not found in codebase' as note,
    NOW() as completed_at;