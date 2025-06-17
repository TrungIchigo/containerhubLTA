-- ============================================================================
-- MIGRATION: Container Types Standardization System
-- Description: Tạo bảng container_types chuẩn hóa và cập nhật schema
-- Version: 1.0
-- Date: 2024-12-20
-- ============================================================================

-- BƯỚC 1: TẠO BẢNG CONTAINER_TYPES
-- Tạo bảng mới để lưu trữ các loại container chuẩn hóa
CREATE TABLE IF NOT EXISTS public.container_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.container_types IS 'Bảng danh mục các loại container vận chuyển chuẩn hóa.';
COMMENT ON COLUMN public.container_types.code IS 'Mã chuẩn quốc tế của loại container (ví dụ: 20DC, 40HC)';
COMMENT ON COLUMN public.container_types.name IS 'Tên hiển thị thân thiện cho người dùng';
COMMENT ON COLUMN public.container_types.description IS 'Mô tả chi tiết về loại container';

-- BƯỚC 2: ĐIỀN DỮ LIỆU CHUẨN HÓA
-- Xóa dữ liệu cũ (nếu có) và thêm dữ liệu mẫu chuẩn hóa
DELETE FROM public.container_types;

INSERT INTO public.container_types (code, name, description) VALUES
    ('20GP', 'Dry van 20ft', 'Standard dry container 20 feet'),
    ('40GP', 'Dry van 40ft', 'Standard dry container 40 feet'),
    ('40HC', 'High cube 40ft', 'High cube dry container 40 feet'),
    ('45HC', 'High cube 45ft', 'High cube dry container 45 feet'),
    ('20RF', 'Reefer 20ft', 'Refrigerated container 20 feet'),
    ('40RF', 'Reefer 40ft', 'Refrigerated container 40 feet'),
    ('20OT', 'Open top 20ft', 'Open top container 20 feet'),
    ('40OT', 'Open top 40ft', 'Open top container 40 feet'),
    ('20FR', 'Flat rack 20ft', 'Flat rack container 20 feet'),
    ('40FR', 'Flat rack 40ft', 'Flat rack container 40 feet')
ON CONFLICT (code) DO NOTHING;

-- BƯỚC 3: THÊM CỘT CONTAINER_TYPE_ID VÀO CÁC BẢNG HIỆN CÓ
-- Thêm cột container_type_id vào bảng import_containers
ALTER TABLE public.import_containers 
ADD COLUMN IF NOT EXISTS container_type_id UUID REFERENCES public.container_types(id);

-- Thêm cột container_type_id vào bảng export_bookings  
ALTER TABLE public.export_bookings
ADD COLUMN IF NOT EXISTS container_type_id UUID REFERENCES public.container_types(id);

-- BƯỚC 4: MIGRATION DỮ LIỆU HIỆN CÓ
-- Cập nhật dữ liệu hiện có trong import_containers
UPDATE public.import_containers 
SET container_type_id = (
    SELECT ct.id 
    FROM public.container_types ct 
    WHERE ct.code = import_containers.container_type
    LIMIT 1
)
WHERE container_type_id IS NULL;

-- Cập nhật dữ liệu hiện có trong export_bookings
UPDATE public.export_bookings 
SET container_type_id = (
    SELECT ct.id 
    FROM public.container_types ct 
    WHERE ct.code = export_bookings.required_container_type
    LIMIT 1
)
WHERE container_type_id IS NULL;

-- BƯỚC 5: TẠO INDEXES ĐỂ TỐI ƯU HÓA HIỆU SUẤT
CREATE INDEX IF NOT EXISTS idx_container_types_code ON public.container_types(code);
CREATE INDEX IF NOT EXISTS idx_import_containers_container_type_id ON public.import_containers(container_type_id);
CREATE INDEX IF NOT EXISTS idx_export_bookings_container_type_id ON public.export_bookings(container_type_id);

-- BƯỚC 6: CẬP NHẬT RLS POLICIES
-- Enable RLS on container_types table
ALTER TABLE public.container_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read container types
CREATE POLICY IF NOT EXISTS "Allow all authenticated users to read container types" ON public.container_types
    FOR SELECT TO authenticated USING (true);

-- Only allow service_role to modify container types (admin function)
CREATE POLICY IF NOT EXISTS "Only service_role can modify container types" ON public.container_types
    FOR ALL TO service_role USING (true);

-- BƯỚC 7: GRANT PERMISSIONS
GRANT SELECT ON public.container_types TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- BƯỚC 8: THÊM CONSTRAINTS (SAU KHI DỮ LIỆU ĐÃ ĐƯỢC MIGRATION)
-- Lưu ý: Chỉ uncomment sau khi đã kiểm tra dữ liệu migration thành công
-- ALTER TABLE public.import_containers 
-- ALTER COLUMN container_type_id SET NOT NULL;

-- ALTER TABLE public.export_bookings
-- ALTER COLUMN container_type_id SET NOT NULL;

-- BƯỚC 9: KIỂM TRA MIGRATION
-- Kiểm tra dữ liệu đã được migration thành công
SELECT 
    'import_containers' as table_name,
    COUNT(*) as total_rows,
    COUNT(container_type_id) as migrated_rows,
    COUNT(*) - COUNT(container_type_id) as missing_rows
FROM public.import_containers
UNION ALL
SELECT 
    'export_bookings' as table_name,
    COUNT(*) as total_rows,
    COUNT(container_type_id) as migrated_rows,
    COUNT(*) - COUNT(container_type_id) as missing_rows
FROM public.export_bookings;

-- Kiểm tra các loại container types đã được tạo
SELECT 'container_types' as check_type, COUNT(*) as total_types
FROM public.container_types;

-- Hiển thị các container types
SELECT code, name, description 
FROM public.container_types 
ORDER BY code;

SELECT 'Migration completed successfully!' as status;

-- Organization status enum and additional fields for upgrade register flow
CREATE TYPE IF NOT EXISTS public.organization_status AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED');

-- Update organizations table with new fields for registration flow
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS tax_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS status public.organization_status NOT NULL DEFAULT 'ACTIVE';

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.name IS 'Tên công ty/tổ chức, có thể là tên đầy đủ sau khi đã đăng ký.';
COMMENT ON COLUMN public.organizations.tax_code IS 'Mã số thuế của tổ chức, phải là duy nhất.';
COMMENT ON COLUMN public.organizations.status IS 'Trạng thái của tổ chức trên hệ thống.';

-- Create function for fuzzy search organizations
CREATE OR REPLACE FUNCTION fuzzy_search_organizations(search_term TEXT, org_type public.organization_type)
RETURNS SETOF organizations AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.organizations
  WHERE
    -- Simple fuzzy search using ILIKE - can be enhanced later with pg_trgm
    lower(name) LIKE '%' || lower(search_term) || '%'
    AND type = org_type
    AND status = 'ACTIVE'
  ORDER BY 
    -- Prioritize exact matches
    CASE WHEN lower(name) = lower(search_term) THEN 1 ELSE 2 END,
    -- Then by length (shorter names first for better matches)
    length(name)
  LIMIT 5;
END;
$$ LANGUAGE plpgsql; 