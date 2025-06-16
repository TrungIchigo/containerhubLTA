-- Migration: Create cargo_types table and add cargo_type_id to existing tables
-- Description: Implement cargo classification system for better container matching and dispute resolution

-- 1. Create cargo_types table
CREATE TABLE IF NOT EXISTS public.cargo_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    requires_special_handling BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cargo_types IS 'Bảng danh mục các loại hàng hóa chuẩn hóa trong hệ thống.';
COMMENT ON COLUMN public.cargo_types.requires_special_handling IS 'Cờ đánh dấu loại hàng cần xử lý đặc biệt (container lạnh, hàng nguy hiểm, etc.)';

-- 2. Insert sample data
INSERT INTO public.cargo_types (name, description, requires_special_handling) VALUES 
('Hàng Khô / Bách Hóa', 'Hàng hóa thông thường không yêu cầu điều kiện bảo quản đặc biệt.', FALSE),
('Hàng Lạnh / Đông Lạnh', 'Hàng hóa yêu cầu bảo quản bằng container lạnh, có kiểm soát nhiệt độ.', TRUE),
('Hàng Nguy Hiểm (DG)', 'Hàng hóa thuộc danh mục nguy hiểm, tuân thủ quy định IMDG.', TRUE),
('Nông Sản', 'Các sản phẩm nông nghiệp như gạo, cà phê, hạt điều...', FALSE),
('Hàng Quá Khổ / Quá Tải (OOG)', 'Hàng hóa có kích thước vượt tiêu chuẩn của container thường.', TRUE),
('Hàng May Mặc', 'Quần áo, vải vóc, phụ liệu may mặc.', FALSE),
('Hàng Điện Tử', 'Các thiết bị, linh kiện điện tử.', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 3. Add cargo_type_id column to import_containers table
ALTER TABLE public.import_containers 
ADD COLUMN IF NOT EXISTS cargo_type_id UUID REFERENCES public.cargo_types(id);

COMMENT ON COLUMN public.import_containers.cargo_type_id IS 'Loại hàng hóa trong lệnh giao trả container';

-- 4. Add cargo_type_id column to export_bookings table  
ALTER TABLE public.export_bookings 
ADD COLUMN IF NOT EXISTS cargo_type_id UUID REFERENCES public.cargo_types(id);

COMMENT ON COLUMN public.export_bookings.cargo_type_id IS 'Loại hàng hóa trong lệnh lấy container rỗng';

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_import_containers_cargo_type_id ON public.import_containers(cargo_type_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_cargo_type_id ON public.export_bookings(cargo_type_id);

-- 6. Update RLS policies (if needed)
-- Enable RLS on cargo_types table
ALTER TABLE public.cargo_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read cargo types
CREATE POLICY IF NOT EXISTS "Allow all authenticated users to read cargo types" ON public.cargo_types
    FOR SELECT TO authenticated USING (true);

-- Only allow service_role to modify cargo types (admin function)
CREATE POLICY IF NOT EXISTS "Only service_role can modify cargo types" ON public.cargo_types
    FOR ALL TO service_role USING (true);