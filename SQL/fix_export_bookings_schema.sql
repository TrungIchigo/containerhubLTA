-- Fix Export Bookings Schema Issues
-- This script ensures export_bookings table has all required columns

-- 1. Check if pickup_location column exists (some queries expect this instead of pick_up_location)
DO $$
BEGIN
    -- Check if pickup_location column exists, if not add it as alias/computed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'export_bookings' 
        AND column_name = 'pickup_location'
    ) THEN
        -- Add pickup_location as an alias for pick_up_location for backward compatibility
        ALTER TABLE export_bookings ADD COLUMN pickup_location TEXT;
        
        -- Update existing records to sync the values
        UPDATE export_bookings SET pickup_location = pick_up_location WHERE pickup_location IS NULL;
        
        -- Create a trigger to keep them synchronized
        CREATE OR REPLACE FUNCTION sync_pickup_location_fields()
        RETURNS TRIGGER AS $sync$
        BEGIN
            -- If pick_up_location is updated, sync to pickup_location
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                NEW.pickup_location = NEW.pick_up_location;
                RETURN NEW;
            END IF;
            RETURN NULL;
        END;
        $sync$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS sync_pickup_location_trigger ON export_bookings;
        CREATE TRIGGER sync_pickup_location_trigger
            BEFORE INSERT OR UPDATE ON export_bookings
            FOR EACH ROW EXECUTE FUNCTION sync_pickup_location_fields();
    END IF;
END $$;

-- 2. Ensure all required columns exist
ALTER TABLE export_bookings 
    ADD COLUMN IF NOT EXISTS container_type_id UUID REFERENCES container_types(id),
    ADD COLUMN IF NOT EXISTS cargo_type_id UUID REFERENCES cargo_types(id),
    ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id),
    ADD COLUMN IF NOT EXISTS depot_id UUID REFERENCES depots(id),
    ADD COLUMN IF NOT EXISTS attached_documents TEXT[],
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_export_bookings_container_type_id ON export_bookings(container_type_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_cargo_type_id ON export_bookings(cargo_type_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_city_id ON export_bookings(city_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_depot_id ON export_bookings(depot_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_trucking_company_org_id ON export_bookings(trucking_company_org_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_status ON export_bookings(status);

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_export_bookings_updated_at ON export_bookings;
CREATE TRIGGER update_export_bookings_updated_at
    BEFORE UPDATE ON export_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Update any existing records to have proper data types and constraints
-- Ensure required_container_type matches container type codes
UPDATE export_bookings 
SET required_container_type = ct.code
FROM container_types ct
WHERE export_bookings.container_type_id = ct.id
AND export_bookings.required_container_type != ct.code;

-- 6. Add comments for documentation
COMMENT ON COLUMN export_bookings.pickup_location IS 'Legacy field - kept for backward compatibility, synced with pick_up_location';
COMMENT ON COLUMN export_bookings.pick_up_location IS 'Primary field for pickup location';
COMMENT ON COLUMN export_bookings.container_type_id IS 'Foreign key to container_types table';
COMMENT ON COLUMN export_bookings.cargo_type_id IS 'Foreign key to cargo_types table';
COMMENT ON COLUMN export_bookings.city_id IS 'Foreign key to cities table';
COMMENT ON COLUMN export_bookings.depot_id IS 'Foreign key to depots table';

-- 7. Verify the fixes
SELECT 'Export Bookings Schema Check' as check_type,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_name = 'export_bookings'
ORDER BY ordinal_position;

-- Show sample data to verify
SELECT 'Sample Export Bookings Data' as check_type,
       id, booking_number, required_container_type, 
       pick_up_location, pickup_location,
       container_type_id, status
FROM export_bookings
LIMIT 5;

COMMIT; 