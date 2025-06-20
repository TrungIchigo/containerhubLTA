-- Test script để kiểm tra billing schema và tạo test data

-- Step 1: Kiểm tra billing tables có tồn tại không
SELECT 'Checking billing tables existence' as test_step;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('transactions', 'invoices');

-- Step 2: Kiểm tra transaction types
SELECT 'Checking transaction types' as test_step;
SELECT enumlabel as available_types
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'transaction_type';

-- Step 3: Kiểm tra có organization nào để test không
SELECT 'Available organizations for testing' as test_step;
SELECT id, name, type FROM public.organizations LIMIT 5;

-- Step 4: Tạo test transaction (thay thế ORG_ID bằng organization_id thật)
-- Uncomment và thay đổi UUID để test
/*
INSERT INTO public.transactions (
  payer_org_id,
  related_request_id,
  transaction_type,
  amount,
  description,
  status
) VALUES (
  'YOUR_ORG_ID_HERE',  -- Thay bằng organization_id thật
  gen_random_uuid(),
  'COD_SERVICE_FEE',
  20000,
  'Test phí dịch vụ COD',
  'UNPAID'
);
*/

-- Step 5: Kiểm tra transactions hiện có
SELECT 'Current transactions' as test_step;
SELECT 
  t.*,
  o.name as organization_name
FROM public.transactions t
LEFT JOIN public.organizations o ON t.payer_org_id = o.id
ORDER BY t.created_at DESC
LIMIT 5; 