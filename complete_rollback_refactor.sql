-- =================================================================
-- COMPLETE ROLLBACK - HOÀN TÁC TOÀN BỘ REFACTOR AUTHORIZATION
-- =================================================================
-- Script này sẽ hoàn tác hoàn toàn tất cả thay đổi đã thực hiện trong refactor

BEGIN;

-- =================================================================
-- BƯỚC 1: XÓA TẤT CẢ RLS POLICIES MỚI
-- =================================================================

RAISE NOTICE 'Bước 1: Xóa tất cả RLS policies mới...';

-- Xóa policies cho cod_requests
DROP POLICY IF EXISTS "Users can access COD requests based on role" ON public.cod_requests;

-- Xóa policies cho street_turn_requests
DROP POLICY IF EXISTS "Users can access street turn requests based on role" ON public.street_turn_requests;

-- Xóa policies cho organizations
DROP POLICY IF EXISTS "Users can view organizations based on role" ON public.organizations;
DROP POLICY IF EXISTS "Platform Admin can manage organizations" ON public.organizations;

-- Xóa policies cho import_containers
DROP POLICY IF EXISTS "Users can access import containers based on role" ON public.import_containers;

-- Xóa policies cho export_bookings
DROP POLICY IF EXISTS "Users can access export bookings based on role" ON public.export_bookings;

-- Xóa policies cho billing_transactions
DROP POLICY IF EXISTS "Platform Admin can manage all billing transactions" ON public.billing_transactions;
DROP POLICY IF EXISTS "Organizations can view their own billing transactions" ON public.billing_transactions;

-- Xóa policies cho profiles
DROP POLICY IF EXISTS "Users can manage profiles based on role" ON public.profiles;

-- =================================================================
-- BƯỚC 2: XÓA HELPER FUNCTIONS
-- =================================================================

RAISE NOTICE 'Bước 2: Xóa helper functions...';

DROP FUNCTION IF EXISTS public.is_platform_admin();
DROP FUNCTION IF EXISTS public.can_approve_requests();

-- =================================================================
-- BƯỚC 3: KHÔI PHỤC POLICIES CŨ
-- =================================================================

RAISE NOTICE 'Bước 3: Khôi phục policies cũ...';

-- Khôi phục policy cũ cho cod_requests
CREATE POLICY "Involved parties can access COD requests" 
ON public.cod_requests FOR ALL
USING (
  requesting_org_id = public.get_current_org_id() OR
  approving_org_id = public.get_current_org_id()
);

-- Khôi phục policy cũ cho street_turn_requests
CREATE POLICY "Users can access street turn requests based on organization"
ON public.street_turn_requests FOR ALL
USING (
  requesting_org_id = public.get_current_org_id() OR
  approving_org_id = public.get_current_org_id() OR
  dropoff_trucking_org_id = public.get_current_org_id()
);

-- Khôi phục policy cũ cho organizations
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (id = public.get_current_org_id());

-- Khôi phục policy cũ cho import_containers  
CREATE POLICY "Users can access import containers based on organization"
ON public.import_containers FOR ALL
USING (organization_id = public.get_current_org_id());

-- Khôi phục policy cũ cho export_bookings
CREATE POLICY "Users can access export bookings based on organization"
ON public.export_bookings FOR ALL
USING (organization_id = public.get_current_org_id());

-- Khôi phục policy cũ cho billing_transactions
CREATE POLICY "Users can view billing transactions based on organization"
ON public.billing_transactions FOR SELECT
USING (organization_id = public.get_current_org_id());

-- Khôi phục policy cũ cho profiles
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR ALL
USING (id = auth.uid());

-- =================================================================
-- BƯỚC 4: KHÔI PHỤC DATABASE CONSTRAINTS
-- =================================================================

RAISE NOTICE 'Bước 4: Khôi phục database constraints...';

-- Khôi phục NOT NULL constraint cho organization_id
-- Lưu ý: Chỉ làm điều này nếu không có PLATFORM_ADMIN nào trong hệ thống
DO $$
DECLARE
    platform_admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO platform_admin_count 
    FROM public.profiles 
    WHERE role = 'PLATFORM_ADMIN';
    
    IF platform_admin_count = 0 THEN
        ALTER TABLE public.profiles
        ALTER COLUMN organization_id SET NOT NULL;
        RAISE NOTICE 'Đã khôi phục NOT NULL constraint cho profiles.organization_id';
    ELSE
        RAISE NOTICE 'CẢNH BÁO: Vẫn còn % tài khoản PLATFORM_ADMIN. Không thể khôi phục NOT NULL constraint', platform_admin_count;
        RAISE NOTICE 'Hãy xóa hoặc cập nhật các tài khoản này trước khi khôi phục constraint';
    END IF;
END$$;

-- =================================================================
-- BƯỚC 5: XÓA PLATFORM_ADMIN ROLE (TÙY CHỌN)
-- =================================================================

RAISE NOTICE 'Bước 5: Kiểm tra PLATFORM_ADMIN role...';

-- Kiểm tra xem có tài khoản nào đang sử dụng PLATFORM_ADMIN không
DO $$
DECLARE
    platform_admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO platform_admin_count 
    FROM public.profiles 
    WHERE role = 'PLATFORM_ADMIN';
    
    IF platform_admin_count = 0 THEN
        RAISE NOTICE 'Không có tài khoản PLATFORM_ADMIN nào. Có thể xóa role này khỏi ENUM';
        RAISE NOTICE 'Để xóa role, hãy chạy: ALTER TYPE public.user_role DROP VALUE IF EXISTS ''PLATFORM_ADMIN'';';
        RAISE NOTICE 'Lưu ý: PostgreSQL không hỗ trợ DROP VALUE cho ENUM, bạn có thể cần recreate ENUM';
    ELSE
        RAISE NOTICE 'CẢNH BÁO: Vẫn còn % tài khoản PLATFORM_ADMIN', platform_admin_count;
        RAISE NOTICE 'Hãy xóa hoặc cập nhật các tài khoản này trước khi xóa role';
    END IF;
END$$;

-- =================================================================
-- BƯỚC 6: VALIDATION
-- =================================================================

RAISE NOTICE 'Bước 6: Validation...';

-- Kiểm tra policies đã được khôi phục
DO $$
DECLARE
    old_policies INTEGER;
    new_policies INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_policies
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND policyname LIKE '%based on organization%';
    
    SELECT COUNT(*) INTO new_policies
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND policyname LIKE '%based on role%';
    
    RAISE NOTICE 'Policies cũ (based on organization): %', old_policies;
    RAISE NOTICE 'Policies mới (based on role): %', new_policies;
    
    IF new_policies = 0 AND old_policies > 0 THEN
        RAISE NOTICE '✅ Rollback policies thành công';
    ELSE
        RAISE NOTICE '⚠️  Có thể còn vấn đề với policies';
    END IF;
END$$;

-- Liệt kê tất cả policies hiện tại
RAISE NOTICE '';
RAISE NOTICE '📋 DANH SÁCH POLICIES HIỆN TẠI:';
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE '- %: %', policy_record.tablename, policy_record.policyname;
    END LOOP;
END$$;

COMMIT;

-- =================================================================
-- THÔNG BÁO HOÀN THÀNH
-- =================================================================

RAISE NOTICE '';
RAISE NOTICE '🔄 COMPLETE ROLLBACK HOÀN THÀNH';
RAISE NOTICE '';
RAISE NOTICE '✅ ĐÃ HOÀN TÁC:';
RAISE NOTICE '- Tất cả RLS policies mới';
RAISE NOTICE '- Helper functions'; 
RAISE NOTICE '- Khôi phục policies cũ';
RAISE NOTICE '- Kiểm tra constraints';
RAISE NOTICE '';
RAISE NOTICE '⚠️  VIỆC CẦN LÀM TIẾP THEO:';
RAISE NOTICE '1. Rollback code changes:';
RAISE NOTICE '   - Xóa src/lib/authorization.ts';
RAISE NOTICE '   - Xóa src/hooks/use-permissions.ts';  
RAISE NOTICE '   - Rollback src/middleware.ts';
RAISE NOTICE '   - Rollback src/lib/actions/cod.ts';
RAISE NOTICE '   - Rollback các components đã sửa';
RAISE NOTICE '';
RAISE NOTICE '2. Xóa các tài khoản PLATFORM_ADMIN (nếu có)';
RAISE NOTICE '3. Test lại tất cả chức năng';
RAISE NOTICE '4. Deploy rollback lên production (nếu cần)';
RAISE NOTICE '';
RAISE NOTICE '🎯 Hệ thống đã được rollback về trạng thái trước refactor!'; 