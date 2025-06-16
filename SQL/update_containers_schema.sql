-- #############################################################
-- # MIGRATION: UPDATE CONTAINERS SCHEMA FOR LOCATION SYSTEM #
-- # Thêm city_id và depot_id vào import_containers và export_bookings #
-- #############################################################

-- BƯỚC 1: THÊM CỘT CITY_ID VÀ DEPOT_ID VÀO IMPORT_CONTAINERS
ALTER TABLE public.import_containers 
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id),
ADD COLUMN IF NOT EXISTS depot_id UUID REFERENCES public.depots(id);

-- BƯỚC 2: THÊM CỘT CITY_ID VÀ DEPOT_ID VÀO EXPORT_BOOKINGS  
ALTER TABLE public.export_bookings
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id),
ADD COLUMN IF NOT EXISTS depot_id UUID REFERENCES public.depots(id);

-- BƯỚC 3: TẠO INDEXES CHO HIỆU SUẤT
CREATE INDEX IF NOT EXISTS idx_import_containers_city_id ON public.import_containers(city_id);
CREATE INDEX IF NOT EXISTS idx_import_containers_depot_id ON public.import_containers(depot_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_city_id ON public.export_bookings(city_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_depot_id ON public.export_bookings(depot_id);

-- BƯỚC 4: THÊM COMMENTS ĐỂ GIẢI THÍCH
COMMENT ON COLUMN public.import_containers.city_id IS 'ID của thành phố/tỉnh nơi container được dỡ hàng';
COMMENT ON COLUMN public.import_containers.depot_id IS 'ID của depot/địa điểm cụ thể nơi container được dỡ hàng';
COMMENT ON COLUMN public.export_bookings.city_id IS 'ID của thành phố/tỉnh nơi cần lấy container';
COMMENT ON COLUMN public.export_bookings.depot_id IS 'ID của depot/địa điểm cụ thể nơi cần lấy container';

-- BƯỚC 5: THÔNG BÁO HOÀN TẤT
SELECT 'Cập nhật schema cho location system thành công!' as status; 