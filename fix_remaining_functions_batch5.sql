-- Fix remaining functions batch 5: calculate_distance, find_containers_within_radius
-- Note: get_matching_suggestions is not a SQL function but TypeScript functions

-- Fix calculate_distance_km function
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    earth_radius CONSTANT NUMERIC := 6371; -- Earth radius in kilometers
    dlat NUMERIC;
    dlon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    -- Return NULL if any coordinate is NULL
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius * c;
END;
$$;

-- Fix find_containers_within_radius function
CREATE OR REPLACE FUNCTION public.find_containers_within_radius(
    start_lat NUMERIC,
    start_lon NUMERIC,
    radius_km INT
)
RETURNS SETOF public.import_containers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Return containers within the specified radius
    -- Uses PostGIS ST_DWithin function for geographic distance calculation
    RETURN QUERY
    SELECT * FROM public.import_containers
    WHERE 
        latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND ST_DWithin(
            -- Container location
            ST_MakePoint(longitude, latitude)::geography,
            -- Search center point
            ST_MakePoint(start_lon, start_lat)::geography,
            -- Radius in meters (convert km to meters)
            radius_km * 1000
        );
END;
$$;

PRINT 'Fixed calculate_distance_km and find_containers_within_radius functions with SECURITY DEFINER and SET search_path = \'\'.';