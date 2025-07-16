-- Import GPG COD fee matrix data with hardcoded values
-- First, clear existing data
DELETE FROM public.gpg_cod_fee_matrix;

-- Define GPG depot data
WITH gpg_depot_data AS (
  SELECT * FROM (
    VALUES 
      ('18e98815-c7e1-4394-bfd1-3132a227ec0b'::uuid, 'Smart Cát Lái Depot', 'SCL', 10.76740000, 106.77530000, 'ee5f6580-7f13-4736-a2a7-708f348117e1'::uuid),  -- HCM
      ('24521324-b93c-4354-911f-b7ef3b2c257c'::uuid, 'E-Depots An Đồn', 'EAD', 16.08240000, 108.23930000, '9e039e8c-cfbf-4cca-aae5-2d165c8bbe3d'::uuid),  -- Da Nang
      ('3bc2f4dd-ce0c-4d54-b477-f7e98bf73963'::uuid, 'BNP Sóng Thần Depot', 'BST', 10.89530000, 106.75610000, 'ee5f6580-7f13-4736-a2a7-708f348117e1'::uuid),  -- Binh Duong
      ('553b1a53-5023-4a15-8d09-4787980a75ca'::uuid, 'E-Depots Tiên Sa 1', 'ETS', 16.12150000, 108.23200000, '9e039e8c-cfbf-4cca-aae5-2d165c8bbe3d'::uuid),  -- Da Nang
      ('5c5a67c7-d2f0-4c47-a332-1a8c3e2ce1c1'::uuid, 'E-Depots Đình Vũ', 'EDV', 20.83330000, 106.76670000, '9e039e8c-cfbf-4cca-aae5-2d165c8bbe3d'::uuid),  -- Hai Phong
      ('6c5a67c7-d2f0-4c47-a332-1a8c3e2ce1c2'::uuid, 'E-Depots Lạch Huyện', 'ELH', 20.83330000, 106.76670000, '9e039e8c-cfbf-4cca-aae5-2d165c8bbe3d'::uuid)  -- Hai Phong
  ) AS t(id, name, short_name, latitude, longitude, city_id)
)
-- First insert into gpg_depots table
INSERT INTO public.gpg_depots (id, name, short_name, latitude, longitude, city_id)
SELECT id, name, short_name, latitude, longitude, city_id
FROM gpg_depot_data
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  city_id = EXCLUDED.city_id;

-- Then create fee matrix between GPG depots
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
        ELSE 1.6  -- Different city multiplier
      END
    ) as road_distance_km
  FROM public.gpg_depots o
  CROSS JOIN public.gpg_depots d
  WHERE o.id != d.id  -- Don't create pairs with same depot
    AND o.city_id = d.city_id  -- Only create pairs within same city/region
),
fee_calculation AS (
  SELECT 
    *,
    -- Calculate COD fee based on distance
    -- Base fee: 350,000 VND for first 30km
    -- Additional fee: 5,000 VND per km beyond 30km
    -- Round to nearest 10,000 VND
    ROUND(
      (
        350000 + -- Base fee
        GREATEST(road_distance_km - 30, 0) * 5000  -- Additional distance fee
      ) / 10000
    ) * 10000 as fee
  FROM distance_matrix
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
FROM fee_calculation
ORDER BY road_distance_km; 