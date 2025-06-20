-- Migration: Add image and document upload capabilities
-- Description: Add columns for storing image URLs and document URLs for import containers
-- Date: 2024
-- Version: 1.0

-- 1. Add image and document URL columns to import_containers table
ALTER TABLE public.import_containers 
ADD COLUMN IF NOT EXISTS condition_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attached_documents TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.import_containers.condition_images IS 'Mảng các URL hình ảnh tình trạng container (bắt buộc)';
COMMENT ON COLUMN public.import_containers.attached_documents IS 'Mảng các URL chứng từ đính kèm (tùy chọn)';

-- 2. Also add to export_bookings for consistency (though mainly used for import containers)
ALTER TABLE public.export_bookings 
ADD COLUMN IF NOT EXISTS attached_documents TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.export_bookings.attached_documents IS 'Mảng các URL chứng từ đính kèm (tùy chọn)';

-- 3. Create indexes for better performance when querying by images
CREATE INDEX IF NOT EXISTS idx_import_containers_condition_images ON public.import_containers USING GIN (condition_images);
CREATE INDEX IF NOT EXISTS idx_import_containers_attached_documents ON public.import_containers USING GIN (attached_documents);
CREATE INDEX IF NOT EXISTS idx_export_bookings_attached_documents ON public.export_bookings USING GIN (attached_documents); 