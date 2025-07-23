-- UPDATE CARRIER_ADMIN GLOBAL ACCESS
-- This script updates RLS policies to allow CARRIER_ADMIN role to view all data across organizations

-- 1. Create helper function to check if current user is CARRIER_ADMIN
CREATE OR REPLACE FUNCTION public.is_carrier_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'CARRIER_ADMIN'
  );
$$;

-- 2. Update COD requests RLS policy
DROP POLICY IF EXISTS "Involved parties can access COD requests" ON public.cod_requests;

CREATE POLICY "Involved parties can access COD requests" ON public.cod_requests
FOR ALL USING (
    -- CARRIER_ADMIN can access all COD requests
    public.is_carrier_admin() OR
    -- Other users can only access their organization's requests
    (requesting_org_id = public.get_current_org_id()) OR 
    (approving_org_id = public.get_current_org_id())
);

-- 3. Update COD audit logs RLS policy
DROP POLICY IF EXISTS "Involved parties can view COD audit logs" ON public.cod_audit_logs;

CREATE POLICY "Involved parties can view COD audit logs" ON public.cod_audit_logs
FOR SELECT USING (
    -- CARRIER_ADMIN can view all audit logs
    public.is_carrier_admin() OR
    -- Other users can only view logs for their organization's requests
    EXISTS (
        SELECT 1 FROM public.cod_requests cr 
        WHERE cr.id = cod_audit_logs.request_id 
        AND (cr.requesting_org_id = public.get_current_org_id() OR cr.approving_org_id = public.get_current_org_id())
    )
);

-- 4. Update street turn requests RLS policies
DROP POLICY IF EXISTS "Users can view involved requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Users can view street_turn_requests for their organization" ON public.street_turn_requests;

CREATE POLICY "Users can view street_turn_requests" ON public.street_turn_requests
FOR SELECT USING (
    -- CARRIER_ADMIN can view all street turn requests
    public.is_carrier_admin() OR
    -- Other users can only view requests involving their organization
    approving_org_id = public.get_current_org_id() OR
    dropoff_trucking_org_id = public.get_current_org_id() OR
    pickup_trucking_org_id = public.get_current_org_id()
);

-- 5. Update street turn requests update policy
DROP POLICY IF EXISTS "Authorized users can update requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Carrier admins can update street_turn_requests" ON public.street_turn_requests;

CREATE POLICY "Carrier admins can update street_turn_requests" ON public.street_turn_requests
FOR UPDATE USING (
    -- CARRIER_ADMIN can update any request (global access)
    public.is_carrier_admin()
);

-- 6. Update import containers RLS policy to allow CARRIER_ADMIN global view
DROP POLICY IF EXISTS "Organizations can view their containers" ON public.import_containers;
DROP POLICY IF EXISTS "Users can view their organization containers" ON public.import_containers;

CREATE POLICY "Users can view import containers" ON public.import_containers
FOR SELECT USING (
    -- CARRIER_ADMIN can view all containers
    public.is_carrier_admin() OR
    -- Other users can only view their organization's containers
    trucking_company_org_id = public.get_current_org_id() OR
    shipping_line_org_id = public.get_current_org_id()
);

-- 7. Update export bookings RLS policy to allow CARRIER_ADMIN global view
DROP POLICY IF EXISTS "Organizations can view their bookings" ON public.export_bookings;
DROP POLICY IF EXISTS "Users can view their organization bookings" ON public.export_bookings;

CREATE POLICY "Users can view export bookings" ON public.export_bookings
FOR SELECT USING (
    -- CARRIER_ADMIN can view all bookings
    public.is_carrier_admin() OR
    -- Other users can only view their organization's bookings
    trucking_company_org_id = public.get_current_org_id() OR
    shipping_line_org_id = public.get_current_org_id()
);

-- 8. Update organizations RLS policy to allow CARRIER_ADMIN global view
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

CREATE POLICY "Users can view organizations" ON public.organizations
FOR SELECT USING (
    -- CARRIER_ADMIN can view all organizations
    public.is_carrier_admin() OR
    -- Other users can only view their own organization
    id = public.get_current_org_id()
);

-- 9. Update profiles RLS policy to allow CARRIER_ADMIN global view
DROP POLICY IF EXISTS "Users can view their organization profiles" ON public.profiles;

CREATE POLICY "Users can view profiles" ON public.profiles
FOR SELECT USING (
    -- CARRIER_ADMIN can view all profiles
    public.is_carrier_admin() OR
    -- Users can view their own profile
    id = auth.uid() OR
    -- Users can view profiles within their organization
    organization_id = public.get_current_org_id()
);

-- 10. Create read-only policy for transactions (billing data)
DROP POLICY IF EXISTS "Organizations can view their transactions" ON public.transactions;

CREATE POLICY "Users can view transactions" ON public.transactions
FOR SELECT USING (
    -- CARRIER_ADMIN can view all transactions
    public.is_carrier_admin() OR
    -- Other users can only view their organization's transactions
    payer_org_id = public.get_current_org_id()
);

-- 11. Create read-only policy for invoices (billing data)
DROP POLICY IF EXISTS "Organizations can view their invoices" ON public.invoices;

CREATE POLICY "Users can view invoices" ON public.invoices
FOR SELECT USING (
    -- CARRIER_ADMIN can view all invoices
    public.is_carrier_admin() OR
    -- Other users can only view their organization's invoices
    organization_id_id = public.get_current_org_id()
);

-- 12. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_carrier_admin() TO authenticated;

-- 13. Verification queries
SELECT 'CARRIER_ADMIN Global Access Setup Completed!' as status;

SELECT 
    'Policy Check' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('cod_requests', 'street_turn_requests', 'import_containers', 'export_bookings', 'organizations', 'profiles', 'transactions', 'invoices')
ORDER BY tablename, policyname;

-- Test the is_carrier_admin function
SELECT 
    'Function Test' as test_type,
    public.is_carrier_admin() as is_carrier_admin_result,
    auth.uid() as current_user_id,
    (SELECT role FROM public.profiles WHERE id = auth.uid()) as current_user_role; 