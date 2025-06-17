-- Fix auto approval function to use new field names
-- Run this in Supabase SQL Editor

-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_auto_approval ON street_turn_requests;

-- Drop existing function 
DROP FUNCTION IF EXISTS handle_auto_approval();

-- Create updated auto approval function with correct field names
CREATE OR REPLACE FUNCTION handle_auto_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rule_record RECORD;
    condition_record RECORD;
    all_conditions_met BOOLEAN := FALSE;
    container_data RECORD;
    booking_data RECORD;
BEGIN
    -- Only process PENDING requests
    IF NEW.status != 'PENDING' THEN
        RETURN NEW;
    END IF;
    
    -- Get container and booking data for evaluation
    SELECT ic.*, ct.code as container_type_code
    INTO container_data
    FROM import_containers ic
    LEFT JOIN container_types ct ON ic.container_type_id = ct.id
    WHERE ic.id = NEW.import_container_id;
    
    SELECT eb.*, ct.code as required_container_type_code
    INTO booking_data  
    FROM export_bookings eb
    LEFT JOIN container_types ct ON eb.container_type_id = ct.id
    WHERE eb.id = NEW.export_booking_id;
    
    -- Loop through active auto approval rules for the approving organization
    FOR rule_record IN 
        SELECT * FROM auto_approval_rules 
        WHERE organization_id = NEW.approving_org_id 
          AND is_active = true 
        ORDER BY priority ASC
    LOOP
        all_conditions_met := TRUE;
        
        -- Check all conditions for this rule
        FOR condition_record IN 
            SELECT * FROM rule_conditions 
            WHERE rule_id = rule_record.id
        LOOP
            CASE condition_record.type
                WHEN 'CONTAINER_TYPE' THEN
                    IF NOT (container_data.container_type_code = ANY(
                        SELECT jsonb_array_elements_text(condition_record.value)
                    )) THEN
                        all_conditions_met := FALSE;
                        EXIT;
                    END IF;
                    
                WHEN 'ALLOWED_TRUCKING_CO' THEN
                    IF NOT (NEW.dropoff_trucking_org_id::text = ANY(
                        SELECT jsonb_array_elements_text(condition_record.value)
                    )) THEN
                        all_conditions_met := FALSE;
                        EXIT;
                    END IF;
                    
                WHEN 'MAX_DISTANCE_KM' THEN
                    -- Distance check would go here
                    -- For now, we'll assume this passes
                    NULL;
                    
                ELSE
                    -- Unknown condition type
                    all_conditions_met := FALSE;
                    EXIT;
            END CASE;
        END LOOP;
        
        -- If all conditions met, auto-approve
        IF all_conditions_met THEN
            -- Update the request status
            UPDATE street_turn_requests 
            SET 
                status = 'APPROVED',
                auto_approved_by_rule_id = rule_record.id,
                updated_at = now()
            WHERE id = NEW.id;
            
            -- Update container and booking status
            UPDATE import_containers 
            SET status = 'CONFIRMED' 
            WHERE id = NEW.import_container_id;
            
            UPDATE export_bookings 
            SET status = 'CONFIRMED' 
            WHERE id = NEW.export_booking_id;
            
            -- Return the updated record
            SELECT * INTO NEW FROM street_turn_requests WHERE id = NEW.id;
            RETURN NEW;
        END IF;
    END LOOP;
    
    -- No matching rule found, request remains PENDING
    RETURN NEW;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_auto_approval() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_auto_approval() TO service_role;

-- Create trigger to call auto-approval function
CREATE TRIGGER trigger_auto_approval
    AFTER INSERT ON street_turn_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_auto_approval();

-- Verify the function was created successfully
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_auto_approval'; 