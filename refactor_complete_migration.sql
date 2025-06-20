-- REFACTOR AUTHORIZATION: MIGRATION HOÀN CHỈNH
-- Chuyển đổi từ "Carrier Admin" sang "Platform Admin" 
-- Thực hiện theo kế hoạch trong "1. Refactor 1.md"

BEGIN;

-- ==============================================
-- BƯỚC 1: Cập nhật ENUM và Schema Cơ bản
-- ==============================================

-- Thêm vai trò PLATFORM_ADMIN vào ENUM user_role nếu chưa có
DO $$
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'user_role' AND e.enumlabel = 'PLATFORM_ADMIN'
    ) THEN 
        ALTER TYPE public.user_role ADD VALUE 'PLATFORM_ADMIN'; 
        RAISE NOTICE 'Đã thêm vai trò PLATFORM_ADMIN vào ENUM user_role';
    ELSE
        RAISE NOTICE 'Vai trò PLATFORM_ADMIN đã tồn tại';
    END IF;
END$$;

-- Cho phép cột organization_id trong bảng profiles có thể là NULL
-- Điều này cần thiết cho tài khoản PLATFORM_ADMIN không thuộc tổ chức nào
ALTER TABLE public.profiles
ALTER COLUMN organization_id DROP NOT NULL;

RAISE NOTICE 'Đã cập nhật bảng profiles cho phép organization_id = NULL';

-- ==============================================
-- BƯỚC 2: Cập nhật RLS Policies cho Platform Admin
-- ==============================================

-- 1. Cập nhật policy cho bảng cod_requests
DROP POLICY IF EXISTS "Involved parties can access COD requests" ON public.cod_requests;
DROP POLICY IF EXISTS "Users can access COD requests based on role" ON public.cod_requests;

CREATE POLICY "Users can access COD requests based on role"
ON public.cod_requests FOR ALL
USING (
  -- Platform Admin có thể thấy tất cả
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN' OR
  -- Các vai trò khác chỉ thấy yêu cầu của mình
  (requesting_org_id = public.get_current_org_id()) OR
  (approving_org_id = public.get_current_org_id())
);

-- 2. Cập nhật policy cho bảng street_turn_requests  
DROP POLICY IF EXISTS "Users can access street turn requests based on organization" ON public.street_turn_requests;

CREATE POLICY "Users can access street turn requests based on role"
ON public.street_turn_requests FOR ALL  
USING (
  -- Platform Admin có thể thấy tất cả
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN' OR
  -- Các vai trò khác chỉ thấy yêu cầu liên quan đến tổ chức mình
  (requesting_org_id = public.get_current_org_id()) OR
  (approving_org_id = public.get_current_org_id()) OR
  (dropoff_trucking_org_id = public.get_current_org_id())
);

-- 3. Cập nhật policy cho bảng organizations
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;

CREATE POLICY "Users can view organizations based on role"
ON public.organizations FOR SELECT
USING (
  -- Platform Admin có thể xem tất cả tổ chức
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN' OR
  -- Các vai trò khác chỉ xem tổ chức của mình
  (id = public.get_current_org_id())
);

-- 4. Cập nhật policy cho bảng import_containers
DROP POLICY IF EXISTS "Users can access import containers based on organization" ON public.import_containers;

CREATE POLICY "Users can access import containers based on role"
ON public.import_containers FOR ALL
USING (
  -- Platform Admin có thể thấy tất cả
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN' OR
  -- Các vai trò khác chỉ thấy container của tổ chức mình
  (organization_id = public.get_current_org_id())
);

-- 5. Cập nhật policy cho bảng export_bookings
DROP POLICY IF EXISTS "Users can access export bookings based on organization" ON public.export_bookings;

CREATE POLICY "Users can access export bookings based on role"
ON public.export_bookings FOR ALL
USING (
  -- Platform Admin có thể thấy tất cả
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN' OR
  -- Các vai trò khác chỉ thấy booking của tổ chức mình
  (organization_id = public.get_current_org_id())
);

-- 6. Policy cho billing tables (Platform Admin quản lý toàn bộ billing)
DROP POLICY IF EXISTS "Users can view billing transactions based on organization" ON public.billing_transactions;

CREATE POLICY "Platform Admin can manage all billing transactions"
ON public.billing_transactions FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN'
);

CREATE POLICY "Organizations can view their own billing transactions"  
ON public.billing_transactions FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'PLATFORM_ADMIN' AND
  (organization_id = public.get_current_org_id())
);

-- 7. Đảm bảo Platform Admin có thể insert/update organizations
CREATE POLICY "Platform Admin can manage organizations"
ON public.organizations FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN'
);

-- 8. Đảm bảo Platform Admin có thể quản lý user profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can manage profiles based on role"
ON public.profiles FOR ALL
USING (
  -- Platform Admin có thể quản lý tất cả profiles
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN' OR
  -- Users chỉ có thể thấy và cập nhật profile của mình
  (id = auth.uid())
);

-- ==============================================
-- BƯỚC 3: Tạo Tài Khoản Platform Admin Mặc Định
-- ==============================================

-- Kiểm tra xem đã có tài khoản Platform Admin nào chưa
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'PLATFORM_ADMIN';
    
    IF admin_count = 0 THEN
        RAISE NOTICE 'Chưa có tài khoản Platform Admin nào. Vui lòng tạo thủ công thông qua UI sau khi deploy.';
        RAISE NOTICE 'Hoặc sử dụng Supabase Auth để tạo user và sau đó cập nhật role = PLATFORM_ADMIN';
    ELSE
        RAISE NOTICE 'Đã có % tài khoản Platform Admin trong hệ thống', admin_count;
    END IF;
END$$;

-- ==============================================
-- BƯỚC 4: Tạo Function Helper cho Authorization
-- ==============================================

-- Function kiểm tra xem user hiện tại có phải Platform Admin không
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'PLATFORM_ADMIN',
    false
  );
$$;

-- Function kiểm tra xem user hiện tại có quyền approve requests không
CREATE OR REPLACE FUNCTION public.can_approve_requests()
RETURNS BOOLEAN  
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('PLATFORM_ADMIN', 'CARRIER_ADMIN'),
    false
  );
$$;

-- ==============================================
-- BƯỚC 5: Validation và Kiểm Tra
-- ==============================================

-- Kiểm tra các policy đã được tạo thành công
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND policyname LIKE '%based on role%';
    
    RAISE NOTICE 'Đã tạo thành công % policies với logic based on role', policy_count;
END$$;

-- Kiểm tra functions đã được tạo
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('is_platform_admin', 'can_approve_requests');
    
    RAISE NOTICE 'Đã tạo thành công % helper functions cho authorization', func_count;
END$$;

COMMIT;

-- ==============================================
-- THÔNG BÁO HOÀN THÀNH
-- ==============================================

RAISE NOTICE '✅ HOÀN THÀNH REFACTOR AUTHORIZATION';
RAISE NOTICE '';
RAISE NOTICE '📋 CHECKLIST SAU KHI MIGRATION:';
RAISE NOTICE '1. Deploy code Frontend với authorization layer mới';
RAISE NOTICE '2. Tạo tài khoản Platform Admin đầu tiên';
RAISE NOTICE '3. Kiểm thử các luồng nghiệp vụ chính';
RAISE NOTICE '4. Cập nhật documentation cho team';
RAISE NOTICE '';
RAISE NOTICE '⚠️  LƯU Ý:';
RAISE NOTICE '- Các Carrier Admin hiện tại vẫn hoạt động bình thường';
RAISE NOTICE '- Platform Admin sẽ có quyền cao nhất, quản lý tất cả';
RAISE NOTICE '- RLS policies đã được cập nhật để hỗ trợ cả hai loại admin'; 