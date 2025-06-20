-- =====================================================
-- FIX BILLING RLS POLICIES
-- Sửa lỗi "relation public.user_organizations does not exist"
-- =====================================================

-- Drop existing faulty policies
DROP POLICY IF EXISTS "Users can view their organization's transactions" ON public.transactions;
DROP POLICY IF EXISTS "Only system can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Only system can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their organization's invoices" ON public.invoices;
DROP POLICY IF EXISTS "Only admins can manage invoices" ON public.invoices;

-- Create correct RLS policies using existing profiles table structure

-- Policies for transactions table
CREATE POLICY "Users can view their organization's transactions" ON public.transactions
    FOR SELECT USING (
        payer_org_id = (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'PLATFORM_ADMIN'
        )
    );

CREATE POLICY "System can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update transactions" ON public.transactions  
    FOR UPDATE USING (true);

-- Policies for invoices table
CREATE POLICY "Users can view their organization's invoices" ON public.invoices
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'PLATFORM_ADMIN'
        )
    );

CREATE POLICY "Users can manage their organization's invoices" ON public.invoices
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM public.profiles 
            WHERE id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'PLATFORM_ADMIN'
        )
    );

-- Grant permissions to authenticated users
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION create_invoice_for_organization(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_invoice_as_paid(UUID) TO authenticated;

SELECT 'Billing RLS policies fixed successfully!' as status; 