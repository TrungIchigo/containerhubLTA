-- =====================================================
-- TEST DATA FOR REGISTER FLOW
-- Creates sample organizations for testing
-- =====================================================

-- Insert some test organizations for testing if they don't exist
INSERT INTO public.organizations (id, name, type, status, created_at) VALUES 
    (gen_random_uuid(), 'Vận Tải Miền Bắc', 'TRUCKING_COMPANY', 'ACTIVE', NOW()),
    (gen_random_uuid(), 'Vận Tải Sài Gòn Express', 'TRUCKING_COMPANY', 'ACTIVE', NOW()),
    (gen_random_uuid(), 'Vận Tải Đông Nam Á', 'TRUCKING_COMPANY', 'ACTIVE', NOW()),
    (gen_random_uuid(), 'Hapag-Lloyd Vietnam', 'SHIPPING_LINE', 'ACTIVE', NOW()),
    (gen_random_uuid(), 'COSCO Vietnam', 'SHIPPING_LINE', 'ACTIVE', NOW())
ON CONFLICT (name) DO NOTHING;

-- Test the fuzzy search function
SELECT 'Testing fuzzy search function:' as test_step;

-- Test 1: Exact match
SELECT 'Test 1 - Exact match:' as test_name, * 
FROM public.fuzzy_search_organizations('Vận Tải Miền Bắc', 'TRUCKING_COMPANY');

-- Test 2: Partial match
SELECT 'Test 2 - Partial match:' as test_name, * 
FROM public.fuzzy_search_organizations('vận tải', 'TRUCKING_COMPANY');

-- Test 3: No match
SELECT 'Test 3 - No match:' as test_name, * 
FROM public.fuzzy_search_organizations('Công ty Không Tồn Tại XYZ', 'TRUCKING_COMPANY');

-- Test 4: Shipping line
SELECT 'Test 4 - Shipping line:' as test_name, * 
FROM public.fuzzy_search_organizations('hapag', 'SHIPPING_LINE');

-- Check if function exists
SELECT 
    'Function check:' as test_step,
    proname as function_name,
    prosrc as function_body_exists
FROM pg_proc 
WHERE proname = 'fuzzy_search_organizations';

-- Check organization table structure
SELECT 
    'Table structure check:' as test_step,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position; 