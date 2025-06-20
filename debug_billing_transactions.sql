-- Debug script để kiểm tra transactions được tạo từ COD approvals

-- Kiểm tra transactions table
SELECT 
  'Checking transactions table' as check_type,
  t.*,
  o.name as organization_name
FROM public.transactions t
LEFT JOIN public.organizations o ON t.payer_org_id = o.id
ORDER BY t.created_at DESC
LIMIT 10;

-- Kiểm tra COD requests gần đây
SELECT 
  'Recent COD requests' as check_type,
  cr.id,
  cr.status,
  cr.cod_fee,
  cr.created_at,
  cr.updated_at,
  req_org.name as requesting_org,
  app_org.name as approving_org
FROM public.cod_requests cr
LEFT JOIN public.organizations req_org ON cr.requesting_org_id = req_org.id
LEFT JOIN public.organizations app_org ON cr.approving_org_id = app_org.id
WHERE cr.status = 'APPROVED'
ORDER BY cr.updated_at DESC
LIMIT 5;

-- Kiểm tra transaction types hiện có
SELECT 
  'Available transaction types' as check_type,
  enumlabel as transaction_type
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'transaction_type';

-- Kiểm tra xem có transactions nào cho COD không
SELECT 
  'COD related transactions' as check_type,
  COUNT(*) as cod_transaction_count
FROM public.transactions
WHERE transaction_type = 'COD_SERVICE_FEE'; 