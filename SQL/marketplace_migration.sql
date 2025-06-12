-- Marketplace Database Migration
-- Cập nhật cấu trúc database để hỗ trợ marketplace functionality

-- Bước 0: Drop tất cả policies cũ để tránh conflicts
DROP POLICY IF EXISTS "Involved parties can view requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Trucking companies can create requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Shipping lines can update (approve/decline) requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Organizations can view their requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Users can create marketplace requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Organizations can update their approval status" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Marketplace listings visible to all authenticated users" ON public.import_containers;

-- Bước 1: Thêm cột vào bảng Lệnh Giao Trả (import_containers)
ALTER TABLE public.import_containers 
ADD COLUMN IF NOT EXISTS is_listed_on_marketplace BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.import_containers.is_listed_on_marketplace IS 'Đánh dấu nếu lệnh này được chào bán công khai trên thị trường.';

-- Bước 2: Tạo các enum types mới (nếu chưa tồn tại)
DO $$ BEGIN
  CREATE TYPE public.party_approval_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.match_type AS ENUM ('INTERNAL', 'MARKETPLACE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Bước 3: Sửa đổi bảng Yêu Cầu Tái Sử Dụng (street_turn_requests)
-- Đổi tên cột cũ để tránh nhầm lẫn (chỉ nếu cột cũ tồn tại)
DO $$ BEGIN
  ALTER TABLE public.street_turn_requests
  RENAME COLUMN requesting_org_id TO dropoff_trucking_org_id;
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

COMMENT ON COLUMN public.street_turn_requests.dropoff_trucking_org_id IS 'ID của công ty vận tải có lệnh giao trả.';

-- Thêm cột cho công ty thứ hai (có thể NULL cho ghép nội bộ)
ALTER TABLE public.street_turn_requests
ADD COLUMN IF NOT EXISTS pickup_trucking_org_id UUID REFERENCES public.organizations(id);

COMMENT ON COLUMN public.street_turn_requests.pickup_trucking_org_id IS 'ID của công ty vận tải có lệnh lấy rỗng (người mua trên thị trường). Có thể NULL nếu là ghép nội bộ.';

-- Thêm cột trạng thái phê duyệt của bên bán
ALTER TABLE public.street_turn_requests
ADD COLUMN IF NOT EXISTS dropoff_org_approval_status public.party_approval_status;

COMMENT ON COLUMN public.street_turn_requests.dropoff_org_approval_status IS 'Trạng thái phê duyệt của công ty giao trả khi có yêu cầu ghép chéo.';

-- Thêm cột để biết đây là loại ghép lệnh gì
ALTER TABLE public.street_turn_requests
ADD COLUMN IF NOT EXISTS match_type public.match_type NOT NULL DEFAULT 'INTERNAL';

COMMENT ON COLUMN public.street_turn_requests.match_type IS 'Loại ghép lệnh: INTERNAL (nội bộ) hoặc MARKETPLACE (chéo công ty).';

-- Bước 4: Cập nhật dữ liệu hiện tại cho các record cũ
-- Đối với các record hiện tại (ghép nội bộ), pickup_trucking_org_id = dropoff_trucking_org_id
UPDATE public.street_turn_requests 
SET pickup_trucking_org_id = dropoff_trucking_org_id
WHERE pickup_trucking_org_id IS NULL;

-- Đối với ghép nội bộ, không cần phê duyệt từ bên bán
UPDATE public.street_turn_requests 
SET dropoff_org_approval_status = 'APPROVED'
WHERE match_type = 'INTERNAL';

-- Bước 5: Tạo indexes để tăng hiệu suất truy vấn
CREATE INDEX IF NOT EXISTS idx_import_containers_marketplace ON public.import_containers(is_listed_on_marketplace) WHERE is_listed_on_marketplace = TRUE;
CREATE INDEX IF NOT EXISTS idx_street_turn_requests_match_type ON public.street_turn_requests(match_type);
CREATE INDEX IF NOT EXISTS idx_street_turn_requests_dropoff_approval ON public.street_turn_requests(dropoff_org_approval_status);

-- Bước 6: Cập nhật RLS policies
-- Policy cho import_containers (marketplace listings)
CREATE POLICY "Marketplace listings visible to all authenticated users" ON public.import_containers
FOR SELECT 
TO authenticated
USING (
  is_listed_on_marketplace = TRUE OR 
  trucking_company_org_id = (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policy cho street_turn_requests (cả 2 bên công ty có thể xem)
CREATE POLICY "Organizations can view their requests" ON public.street_turn_requests
FOR SELECT 
TO authenticated
USING (
  dropoff_trucking_org_id = (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid()
  ) OR
  pickup_trucking_org_id = (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid()
  ) OR
  approving_org_id = (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policy cho insert marketplace requests
CREATE POLICY "Users can create marketplace requests" ON public.street_turn_requests
FOR INSERT 
TO authenticated
WITH CHECK (
  pickup_trucking_org_id = (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policy cho update (approval/decline)
CREATE POLICY "Organizations can update their approval status" ON public.street_turn_requests
FOR UPDATE 
TO authenticated
USING (
  dropoff_trucking_org_id = (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid()
  ) OR
  approving_org_id = (
    SELECT organization_id FROM public.profiles 
    WHERE id = auth.uid()
  )
); 