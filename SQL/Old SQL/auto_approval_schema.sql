-- =====================================================
-- AUTO APPROVAL RULES SCHEMA
-- =====================================================

-- 1. Create auto_approval_rules table
CREATE TABLE IF NOT EXISTS auto_approval_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create rule_conditions table
CREATE TABLE IF NOT EXISTS rule_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES auto_approval_rules(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('CONTAINER_TYPE', 'ALLOWED_TRUCKING_CO', 'MAX_DISTANCE_KM')),
    operator TEXT NOT NULL CHECK (operator IN ('IN', 'EQUALS', 'LESS_THAN_OR_EQUAL')),
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add auto_approved_by_rule_id column to street_turn_requests
ALTER TABLE street_turn_requests 
ADD COLUMN IF NOT EXISTS auto_approved_by_rule_id UUID REFERENCES auto_approval_rules(id);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_approval_rules_org_active 
ON auto_approval_rules(organization_id, is_active, priority);

CREATE INDEX IF NOT EXISTS idx_rule_conditions_rule_id 
ON rule_conditions(rule_id);

CREATE INDEX IF NOT EXISTS idx_street_turn_requests_auto_approved 
ON street_turn_requests(auto_approved_by_rule_id);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE auto_approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_conditions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for auto_approval_rules
CREATE POLICY "Users can view rules of their organization" ON auto_approval_rules
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Carrier admins can manage rules of their organization" ON auto_approval_rules
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE id = auth.uid() AND role = 'CARRIER_ADMIN'
        )
    );

-- 7. Create RLS policies for rule_conditions
CREATE POLICY "Users can view conditions of their rules" ON rule_conditions
    FOR SELECT USING (
        rule_id IN (
            SELECT id FROM auto_approval_rules 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Carrier admins can manage conditions of their rules" ON rule_conditions
    FOR ALL USING (
        rule_id IN (
            SELECT id FROM auto_approval_rules 
            WHERE organization_id IN (
                SELECT organization_id FROM profiles 
                WHERE id = auth.uid() AND role = 'CARRIER_ADMIN'
            )
        )
    );

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create trigger for auto_approval_rules
CREATE TRIGGER update_auto_approval_rules_updated_at 
    BEFORE UPDATE ON auto_approval_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create the core auto-approval function
CREATE OR REPLACE FUNCTION handle_auto_approval()
RETURNS TRIGGER AS $$
DECLARE
    rule_record RECORD;
    condition_record RECORD;
    all_conditions_met BOOLEAN;
    request_container_type TEXT;
    request_trucking_org_id UUID;
    request_distance_km NUMERIC;
    drop_off_location TEXT;
    pickup_location TEXT;
BEGIN
    -- Only process PENDING requests
    IF NEW.status != 'PENDING' THEN
        RETURN NEW;
    END IF;

    -- Get container type and trucking org from the request
    SELECT 
        ic.container_type,
        ic.drop_off_location,
        eb.pick_up_location,
        NEW.requesting_org_id
    INTO 
        request_container_type,
        drop_off_location, 
        pickup_location,
        request_trucking_org_id
    FROM import_containers ic, export_bookings eb
    WHERE ic.id = NEW.import_container_id 
    AND eb.id = NEW.export_booking_id;

    -- Calculate distance (simplified - in real implementation would use PostGIS)
    -- For now, we'll use a mock calculation based on string comparison
    request_distance_km := CASE 
        WHEN drop_off_location = pickup_location THEN 0
        WHEN drop_off_location ILIKE '%TP.HCM%' AND pickup_location ILIKE '%TP.HCM%' THEN 25
        WHEN drop_off_location ILIKE '%Hà Nội%' AND pickup_location ILIKE '%Hà Nội%' THEN 30
        ELSE 100 -- Default distance for different cities
    END;

    -- Loop through active rules for this carrier organization, ordered by priority
    FOR rule_record IN 
        SELECT * FROM auto_approval_rules 
        WHERE organization_id = NEW.approving_org_id 
        AND is_active = true 
        ORDER BY priority ASC
    LOOP
        all_conditions_met := true;
        
        -- Check all conditions for this rule
        FOR condition_record IN 
            SELECT * FROM rule_conditions WHERE rule_id = rule_record.id
        LOOP
            CASE condition_record.type
                WHEN 'CONTAINER_TYPE' THEN
                    IF NOT (request_container_type = ANY(
                        SELECT jsonb_array_elements_text(condition_record.value)
                    )) THEN
                        all_conditions_met := false;
                        EXIT;
                    END IF;
                    
                WHEN 'ALLOWED_TRUCKING_CO' THEN
                    IF NOT (request_trucking_org_id::text = ANY(
                        SELECT jsonb_array_elements_text(condition_record.value)
                    )) THEN
                        all_conditions_met := false;
                        EXIT;
                    END IF;
                    
                WHEN 'MAX_DISTANCE_KM' THEN
                    IF request_distance_km > (condition_record.value->0)::numeric THEN
                        all_conditions_met := false;
                        EXIT;
                    END IF;
                    
                ELSE
                    -- Unknown condition type, fail safe
                    all_conditions_met := false;
                    EXIT;
            END CASE;
        END LOOP;
        
        -- If all conditions are met for this rule, approve the request
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
            
            -- Exit the function as we found a matching rule
            RETURN NEW;
        END IF;
    END LOOP;
    
    -- No matching rule found, request remains PENDING
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to call auto-approval function
DROP TRIGGER IF EXISTS trigger_auto_approval ON street_turn_requests;
CREATE TRIGGER trigger_auto_approval
    AFTER INSERT ON street_turn_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_auto_approval();

-- 12. Insert sample data for testing
INSERT INTO auto_approval_rules (name, description, priority, organization_id) 
SELECT 
    'Tự động duyệt 40HC nội thành',
    'Tự động phê duyệt container 40HC trong nội thành TP.HCM cho các đối tác tin cậy',
    10,
    id
FROM organizations 
WHERE type = 'SHIPPING_LINE' 
LIMIT 1;

-- Get the rule ID for sample conditions
DO $$
DECLARE
    sample_rule_id UUID;
    sample_trucking_org_id UUID;
BEGIN
    -- Get the sample rule ID
    SELECT id INTO sample_rule_id 
    FROM auto_approval_rules 
    WHERE name = 'Tự động duyệt 40HC nội thành' 
    LIMIT 1;
    
    -- Get a sample trucking company ID
    SELECT id INTO sample_trucking_org_id 
    FROM organizations 
    WHERE type = 'TRUCKING_COMPANY' 
    LIMIT 1;
    
    IF sample_rule_id IS NOT NULL AND sample_trucking_org_id IS NOT NULL THEN
        -- Insert sample conditions
        INSERT INTO rule_conditions (rule_id, type, operator, value) VALUES
        (sample_rule_id, 'CONTAINER_TYPE', 'IN', '["40HC"]'),
        (sample_rule_id, 'ALLOWED_TRUCKING_CO', 'IN', '["' || sample_trucking_org_id || '"]'),
        (sample_rule_id, 'MAX_DISTANCE_KM', 'LESS_THAN_OR_EQUAL', '[30]');
    END IF;
END $$; 