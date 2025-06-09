-- =====================================================
-- FIX RLS PERMISSIONS FOR REGISTRATION PROCESS
-- =====================================================
-- Run this script if registration fails due to RLS errors

-- 1. Allow anonymous users to read organizations (for dropdown)
DROP POLICY IF EXISTS "Allow anonymous to read organizations" ON public.organizations;
CREATE POLICY "Allow anonymous to read organizations"
ON public.organizations FOR SELECT
TO anon
USING (true);

-- 2. Allow anonymous users to create organizations (for registration)
DROP POLICY IF EXISTS "Allow anonymous organization creation" ON public.organizations;
CREATE POLICY "Allow anonymous organization creation"
ON public.organizations FOR INSERT
TO anon
WITH CHECK (true);

-- 3. Allow authenticated users to read all organizations
DROP POLICY IF EXISTS "Allow authenticated users to read organizations" ON public.organizations;
CREATE POLICY "Allow authenticated users to read organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

-- 4. Ensure profiles can be created during registration
-- (This should work with existing trigger, but add as backup)
DROP POLICY IF EXISTS "Allow profile creation during registration" ON public.profiles;
CREATE POLICY "Allow profile creation during registration"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 5. Temporary: Allow authenticated users to read other organizations
-- (Needed for dispatcher to see shipping lines and vice versa)
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view all organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (true);

-- 6. Update import containers policy to allow reading from other organizations
DROP POLICY IF EXISTS "Trucking companies can manage their own import containers" ON public.import_containers;
CREATE POLICY "Trucking companies can manage import containers"
ON public.import_containers FOR ALL
TO authenticated
USING (
  trucking_company_org_id = public.get_current_org_id() OR
  shipping_line_org_id = public.get_current_org_id()
)
WITH CHECK (trucking_company_org_id = public.get_current_org_id());

-- 7. Update export bookings policy to allow reading from other organizations  
DROP POLICY IF EXISTS "Trucking companies can manage their own export bookings" ON public.export_bookings;
CREATE POLICY "Trucking companies can manage export bookings"
ON public.export_bookings FOR ALL
TO authenticated
USING (trucking_company_org_id = public.get_current_org_id())
WITH CHECK (trucking_company_org_id = public.get_current_org_id());

-- 8. Fix street turn requests policies for cross-organization access
DROP POLICY IF EXISTS "Involved parties can view requests" ON public.street_turn_requests;
CREATE POLICY "Involved parties can view requests"
ON public.street_turn_requests FOR SELECT
TO authenticated
USING (
  requesting_org_id = public.get_current_org_id() OR 
  approving_org_id = public.get_current_org_id()
);

DROP POLICY IF EXISTS "Trucking companies can create requests" ON public.street_turn_requests;
CREATE POLICY "Trucking companies can create requests"
ON public.street_turn_requests FOR INSERT
TO authenticated
WITH CHECK (requesting_org_id = public.get_current_org_id());

DROP POLICY IF EXISTS "Shipping lines can update (approve/decline) requests" ON public.street_turn_requests;
CREATE POLICY "Shipping lines can update requests"
ON public.street_turn_requests FOR UPDATE
TO authenticated
USING (approving_org_id = public.get_current_org_id());

-- 9. Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.organizations TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.import_containers TO authenticated;
GRANT ALL ON public.export_bookings TO authenticated;
GRANT ALL ON public.street_turn_requests TO authenticated;

-- Verification queries
SELECT 'Organizations table' as table_name, 
       COUNT(*) as row_count 
FROM public.organizations;

SELECT 'RLS Status' as check_type,
       tablename,
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'profiles', 'import_containers', 'export_bookings', 'street_turn_requests')
ORDER BY tablename;

SELECT 'Policies' as check_type,
       tablename,
       policyname,
       permissive,
       roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 