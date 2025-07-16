-- Import GPG depots data
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
  -- Thêm điều kiện để lọc các depot thuộc GPG
  d.name ILIKE '%GPG%' 
  OR d.name ILIKE '%Global Ports%'
  OR d.name ILIKE '%GP%'
  -- Có thể thêm các điều kiện khác tùy theo cách đánh dấu depot GPG trong hệ thống
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city_id = EXCLUDED.city_id,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude; 