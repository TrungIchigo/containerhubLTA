-- Import GPG COD fee matrix data: ALL depots -> GPG depots
-- This script creates COD fee matrix from ANY depot to GPG depots only
-- Following the correct business logic: containers from any depot can COD to GPG depots

-- First, clear existing data
DELETE FROM public.gpg_cod_fee_matrix;

-- Ensure GPG depots exist (insert sample GPG depots if needed)
INSERT INTO public.gpg_depots (id, name, address, city_id, latitude, longitude)
SELECT 
  d.id,
  d.name,
  d.address,
  d.city_id,
  d.latitude,
  d.longitude
FROM public.depots d
WHERE 
  -- Filter for GPG depots based on naming convention
  (d.name ILIKE '%GPG%' 
   OR d.name ILIKE '%Global Ports%'
   OR d.name ILIKE '%E-Depots%'
   OR d.name ILIKE '%Smart%'
   OR d.name ILIKE '%BNP%')
  AND d.latitude IS NOT NULL 
  AND d.longitude IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city_id = EXCLUDED.city_id,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- Create COD fee matrix: ALL depots (origin) -> GPG depots (destination)
WITH distance_matrix AS (
  SELECT 
    o.id as origin_depot_id,
    d.id as destination_depot_id,
    o.city_id as origin_city_id,
    d.city_id as destination_city_id,
    -- Calculate straight-line distance using Haversine formula
    ROUND(
      2 * 6371 * asin(
        sqrt(
          sin(radians((d.latitude - o.latitude)/2))^2 +
          cos(radians(o.latitude)) * cos(radians(d.latitude)) *
          sin(radians((d.longitude - o.longitude)/2))^2
        )
      )
    ) as distance_km,
    -- Calculate road distance (km) using Haversine formula and multiplier
    ROUND(
      2 * 6371 * asin(
        sqrt(
          sin(radians((d.latitude - o.latitude)/2))^2 +
          cos(radians(o.latitude)) * cos(radians(d.latitude)) *
          sin(radians((d.longitude - o.longitude)/2))^2
        )
      ) * 
      CASE 
        WHEN o.city_id = d.city_id THEN 1.3  -- Same city multiplier
        WHEN ABS(o.latitude - d.latitude) + ABS(o.longitude - d.longitude) < 2.0 THEN 1.4  -- Nearby regions
        ELSE 1.6  -- Different regions multiplier
      END
    ) as road_distance_km
  FROM public.depots o  -- Origin: ALL depots (including non-GPG)
  CROSS JOIN public.gpg_depots d  -- Destination: ONLY GPG depots
  WHERE o.id != d.id  -- Don't create pairs with same depot
    AND o.latitude IS NOT NULL 
    AND o.longitude IS NOT NULL
    AND d.latitude IS NOT NULL 
    AND d.longitude IS NOT NULL
),
fee_calculation AS (
  SELECT 
    *,
    -- Calculate COD fee based on distance with tiered pricing
    CASE 
      WHEN road_distance_km <= 30 THEN 350000  -- Base fee for short distance
      WHEN road_distance_km <= 100 THEN 350000 + (road_distance_km - 30) * 5000  -- Medium distance
      WHEN road_distance_km <= 300 THEN 350000 + 70 * 5000 + (road_distance_km - 100) * 3000  -- Long distance  
      ELSE 350000 + 70 * 5000 + 200 * 3000 + (road_distance_km - 300) * 2000  -- Very long distance
    END as calculated_fee
  FROM distance_matrix
),
final_fee AS (
  SELECT 
    *,
    -- Round to nearest 10,000 VND and apply minimum fee
    GREATEST(
      ROUND(calculated_fee / 10000) * 10000,
      200000  -- Minimum fee: 200,000 VND
    ) as fee
  FROM fee_calculation
)
INSERT INTO public.gpg_cod_fee_matrix (
  origin_depot_id,
  destination_depot_id,
  distance_km,
  road_distance_km,
  fee
)
SELECT
  origin_depot_id,
  destination_depot_id,
  distance_km,
  road_distance_km,
  fee
FROM final_fee
WHERE fee >= 200000  -- Ensure minimum fee threshold
ORDER BY origin_depot_id, destination_depot_id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gpg_cod_fee_matrix_origin_destination 
ON public.gpg_cod_fee_matrix(origin_depot_id, destination_depot_id);

-- Display summary
DO $$
DECLARE
    total_routes INTEGER;
    gpg_depot_count INTEGER;
    all_depot_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_routes FROM public.gpg_cod_fee_matrix;
    SELECT COUNT(*) INTO gpg_depot_count FROM public.gpg_depots;
    SELECT COUNT(*) INTO all_depot_count FROM public.depots WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    
    RAISE NOTICE '=== GPG COD Fee Matrix Import Summary ===';
    RAISE NOTICE 'Total routes imported: %', total_routes;
    RAISE NOTICE 'GPG depots (destinations): %', gpg_depot_count; 
    RAISE NOTICE 'All depots (origins): %', all_depot_count;
    RAISE NOTICE 'Expected routes: % (all depots to GPG depots)', (all_depot_count * gpg_depot_count - gpg_depot_count);
    RAISE NOTICE '=== Import completed successfully ===';
END $$; 