-- =================================================================
-- ROLLBACK RLS POLICIES - XÓA TẤT CẢ POLICIES ĐÃ TẠO TRONG REFACTOR
-- =================================================================

BEGIN;

-- =================================================================
-- BƯỚC 1: XÓA TẤT CẢ POLICIES MỚI ĐÃ TẠO
-- =================================================================

-- 1. Xóa policies cho bảng cod_requests
DROP POLICY IF EXISTS "Users can access COD requests based on role" ON public.cod_requests;

-- 2. Xóa policies cho bảng street_turn_requests
DROP POLICY IF EXISTS "Users can access street turn requests based on role" ON public.street_turn_requests;

-- 3. Xóa policies cho bảng organizations (SELECT)
DROP POLICY IF EXISTS "Users can view organizations based on role" ON public.organizations;

-- 4. Xóa policies cho bảng organizations (ALL - management)
DROP POLICY IF EXISTS "Platform Admin can manage organizations" ON public.organizations;

-- 5. Xóa policies cho bảng import_containers
DROP POLICY IF EXISTS "Users can access import containers based on role" ON public.import_containers;

-- 6. Xóa policies cho bảng export_bookings
DROP POLICY IF EXISTS "Users can access export bookings based on role" ON public.export_bookings;

-- 7. Xóa policies cho bảng billing_transactions
DROP POLICY IF EXISTS "Platform Admin can manage all billing transactions" ON public.billing_transactions;
DROP POLICY IF EXISTS "Organizations can view their own billing transactions" ON public.billing_transactions;

-- 8. Xóa policies cho bảng profiles
DROP POLICY IF EXISTS "Users can manage profiles based on role" ON public.profiles;

-- =================================================================
-- BƯỚC 2: XÓA HELPER FUNCTIONS ĐÃ TẠO
-- =================================================================

-- Xóa function kiểm tra Platform Admin
DROP FUNCTION IF EXISTS public.is_platform_admin();

-- Xóa function kiểm tra quyền approve
DROP FUNCTION IF EXISTS public.can_approve_requests();

-- =================================================================
-- BƯỚC 3: KHÔI PHỤC POLICIES CŨ (NẾU CẦN)
-- =================================================================

-- Lưu ý: Bạn có thể cần khôi phục lại policies cũ nếu cần thiết
-- Dưới đây là template, bạn cần điều chỉnh theo policies cũ của hệ thống

-- Ví dụ khôi phục policy cũ cho cod_requests:
-- CREATE POLICY "Involved parties can access COD requests" 
-- ON public.cod_requests FOR ALL
-- USING (
--   requesting_org_id = public.get_current_org_id() OR
--   approving_org_id = public.get_current_org_id()
-- );

-- Ví dụ khôi phục policy cũ cho street_turn_requests:
-- CREATE POLICY "Users can access street turn requests based on organization"
-- ON public.street_turn_requests FOR ALL
-- USING (
--   requesting_org_id = public.get_current_org_id() OR
--   approving_org_id = public.get_current_org_id() OR
--   dropoff_trucking_org_id = public.get_current_org_id()
-- );

-- Ví dụ khôi phục policy cũ cho organizations:
-- CREATE POLICY "Users can view their own organization"
-- ON public.organizations FOR SELECT
-- USING (id = public.get_current_org_id());

-- Ví dụ khôi phục policy cũ cho import_containers:
-- CREATE POLICY "Users can access import containers based on organization"
-- ON public.import_containers FOR ALL
-- USING (organization_id = public.get_current_org_id());

-- Ví dụ khôi phục policy cũ cho export_bookings:
-- CREATE POLICY "Users can access export bookings based on organization"
-- ON public.export_bookings FOR ALL
-- USING (organization_id = public.get_current_org_id());

-- Ví dụ khôi phục policy cũ cho billing_transactions:
-- CREATE POLICY "Users can view billing transactions based on organization"
-- ON public.billing_transactions FOR SELECT
-- USING (organization_id = public.get_current_org_id());

-- Ví dụ khôi phục policy cũ cho profiles:
-- CREATE POLICY "Users can update their own profile"
-- ON public.profiles FOR ALL
-- USING (id = auth.uid());

-- =================================================================
-- BƯỚC 4: VALIDATION
-- =================================================================

-- Kiểm tra các policies đã được xóa
DO $$
DECLARE
    remaining_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_policies
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND policyname LIKE '%based on role%';
    
    IF remaining_policies = 0 THEN
        RAISE NOTICE '✅ Đã xóa thành công tất cả policies "based on role"';
    ELSE
        RAISE NOTICE '⚠️  Vẫn còn % policies "based on role" chưa được xóa', remaining_policies;
    END IF;
END$$;

-- Kiểm tra helper functions đã được xóa
DO $$
DECLARE
    remaining_functions INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname IN ('is_platform_admin', 'can_approve_requests');
    
    IF remaining_functions = 0 THEN
        RAISE NOTICE '✅ Đã xóa thành công tất cả helper functions';
    ELSE
        RAISE NOTICE '⚠️  Vẫn còn % helper functions chưa được xóa', remaining_functions;
    END IF;
END$$;

COMMIT;

-- =================================================================
-- THÔNG BÁO HOÀN THÀNH
-- =================================================================

RAISE NOTICE '';
RAISE NOTICE '🔄 ROLLBACK RLS POLICIES HOÀN THÀNH';
RAISE NOTICE '';
RAISE NOTICE '📋 ĐÃ XÓA:';
RAISE NOTICE '- Tất cả policies "based on role"';
RAISE NOTICE '- Helper functions: is_platform_admin(), can_approve_requests()';
RAISE NOTICE '';
RAISE NOTICE '⚠️  LƯU Ý:';
RAISE NOTICE '- Bạn có thể cần khôi phục lại policies cũ nếu cần thiết';
RAISE NOTICE '- Uncomment và chỉnh sửa các policies ở BƯỚC 3 nếu cần';
RAISE NOTICE '- Kiểm tra lại tất cả chức năng sau khi rollback';
RAISE NOTICE '';
RAISE NOTICE '🎯 Để khôi phục hoàn toàn, bạn cũng nên:';
RAISE NOTICE '1. Xóa PLATFORM_ADMIN role khỏi ENUM user_role (nếu cần)';
RAISE NOTICE '2. Khôi phục NOT NULL constraint cho profiles.organization_id';
RAISE NOTICE '3. Rollback các thay đổi trong code (authorization.ts, middleware.ts, etc.)'; 