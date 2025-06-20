-- Filter Upgrade Functions for Marketplace
-- This file contains PostgreSQL functions to support enhanced marketplace filtering

-- Enable PostGIS extension if not already enabled
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Function to find containers within a specific radius from a given point
-- This function supports the max_distance_km filter
CREATE OR REPLACE FUNCTION find_containers_within_radius(
    start_lat NUMERIC,
    start_lon NUMERIC,
    radius_km INT
)
RETURNS SETOF import_containers AS $$
BEGIN
    -- Return containers within the specified radius
    -- Uses PostGIS ST_DWithin function for geographic distance calculation
    RETURN QUERY
    SELECT * FROM import_containers
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
$$ LANGUAGE plpgsql;

-- Function to get marketplace listings with rating filter
-- This function supports the min_rating filter by joining with partner reviews
CREATE OR REPLACE FUNCTION get_marketplace_listings_with_rating(
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
) AS $$
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
    FROM import_containers ic
    LEFT JOIN (
        SELECT 
            reviewee_org_id,
            AVG(rating) as avg_rating,
            COUNT(*) as review_count
        FROM partner_reviews
        GROUP BY reviewee_org_id
    ) r ON ic.trucking_company_org_id = r.reviewee_org_id
    WHERE 
        ic.is_listed_on_marketplace = true
        AND ic.status = 'AVAILABLE'
        AND COALESCE(r.avg_rating, 0) >= min_rating_value;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate distance between two geographic points
-- Helper function for sorting results by distance
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 NUMERIC,
    lon1 NUMERIC,
    lat2 NUMERIC,
    lon2 NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    -- Return distance in kilometers using PostGIS
    -- Returns NULL if any coordinate is NULL
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN ST_Distance(
        ST_MakePoint(lon1, lat1)::geography,
        ST_MakePoint(lon2, lat2)::geography
    ) / 1000; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql;

-- Function to get all shipping lines for combobox
-- This function supports the shipping line combobox filter
CREATE OR REPLACE FUNCTION get_shipping_lines_for_filter()
RETURNS TABLE (
    id UUID,
    name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name
    FROM organizations o
    WHERE o.type = 'SHIPPING_LINE'
    ORDER BY o.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Comments for usage:
-- 1. find_containers_within_radius: Use this when user selects a max distance filter
-- 2. get_marketplace_listings_with_rating: Use this when user selects a minimum rating filter  
-- 3. calculate_distance_km: Use this for sorting results by distance
-- 4. get_shipping_lines_for_filter: Use this to populate the shipping line combobox 