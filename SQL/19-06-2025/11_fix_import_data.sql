-- Xóa dữ liệu cũ trong gpg_cod_fee_matrix
TRUNCATE TABLE public.gpg_cod_fee_matrix;

-- Insert lại dữ liệu với depot_id từ bảng depots
WITH distance_calc AS (
    SELECT 
        d.id as origin_depot_id,
        gd.id as destination_depot_id,
        -- Tính khoảng cách đường chim bay theo km (nhân với 111.111 để chuyển độ sang km)
        ROUND(
            (ST_DistanceSphere(
                ST_MakePoint(d.longitude, d.latitude),
                ST_MakePoint(gd.longitude, gd.latitude)
            ) / 1000)::numeric,
            2
        ) as distance_km,
        -- Tính khoảng cách đường bộ (ước tính bằng 1.5 lần khoảng cách đường chim bay)
        ROUND(
            (ST_DistanceSphere(
                ST_MakePoint(d.longitude, d.latitude),
                ST_MakePoint(gd.longitude, gd.latitude)
            ) * 1.5 / 1000)::numeric,
            2
        ) as road_distance_km
    FROM public.depots d
    CROSS JOIN public.gpg_depots gd
    WHERE d.id != gd.id  -- Không tạo fee cho cùng một depot
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
    -- Phí base 350,000 + phụ phí theo khoảng cách đường bộ
    CASE 
        WHEN road_distance_km <= 50 THEN 350000                           -- <= 50km: base fee
        WHEN road_distance_km <= 100 THEN 350000 + (road_distance_km - 50) * 5000   -- 50-100km: +5k/km
        WHEN road_distance_km <= 200 THEN 600000 + (road_distance_km - 100) * 4000  -- 100-200km: +4k/km
        ELSE 1000000 + (road_distance_km - 200) * 3000                    -- >200km: +3k/km
    END as fee
FROM distance_calc
ORDER BY road_distance_km; 