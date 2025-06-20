-- Refactor Step 4: Cập nhật RLS Policies để hỗ trợ Platform Admin
-- Platform Admin có thể xem và quản lý tất cả dữ liệu

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

-- 7. Đảm bảo Platform Admin có thể insert/update cần thiết
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