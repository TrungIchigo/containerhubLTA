-- Geocoding Migration
-- Add latitude and longitude columns to import_containers table for map display

-- Add geocoding columns to import_containers table
ALTER TABLE public.import_containers 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add comments for the new columns
COMMENT ON COLUMN public.import_containers.latitude IS 'Vĩ độ của địa điểm giao trả.';
COMMENT ON COLUMN public.import_containers.longitude IS 'Kinh độ của địa điểm giao trả.';

-- Create index for efficient geo queries (if we add spatial queries later)
CREATE INDEX IF NOT EXISTS idx_import_containers_coordinates 
ON public.import_containers(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL; 