-- =====================================================
-- VERIFY MIGRATION STATUS
-- =====================================================

-- 1. Kiểm tra bảng gpg_depots
SELECT 'GPG DEPOTS' as table_name, COUNT(*) as count FROM gpg_depots;

-- 2. Kiểm tra foreign key constraint mới
SELECT 
    'FOREIGN KEY STATUS' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'cod_requests'
        AND kcu.column_name = 'requested_depot_id'
        AND ccu.table_name = 'gpg_depots'
    ) THEN '✅ POINTS TO GPG_DEPOTS' 
    ELSE '❌ STILL POINTS TO DEPOTS' END as status;

-- 3. Kiểm tra COD requests với PENDING_PAYMENT
SELECT 
    'PENDING_PAYMENT COD' as check_type,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as request_ids
FROM cod_requests 
WHERE status = 'PENDING_PAYMENT' AND cod_fee > 0;

-- 4. Kiểm tra prepaid funds
SELECT 
    'PREPAID FUNDS' as check_type,
    COUNT(*) as total_funds,
    SUM(balance) as total_balance,
    COUNT(CASE WHEN balance > 500000 THEN 1 END) as funds_with_sufficient_balance
FROM organization_prepaid_funds;

-- 5. Test query giống như trong billing.ts
SELECT 
    'TEST BILLING QUERY' as check_type,
    cr.id,
    cr.status,
    cr.cod_fee,
    cr.delivery_confirmed_at,
    cr.requested_depot_id
FROM cod_requests cr
WHERE cr.status = 'PENDING_PAYMENT'
  AND cr.cod_fee IS NOT NULL
  AND cr.cod_fee > 0
ORDER BY cr.delivery_confirmed_at ASC
LIMIT 3;

-- 6. Test join với gpg_depots
SELECT 
    'TEST JOIN WITH GPG_DEPOTS' as check_type,
    cr.id,
    cr.cod_fee,
    gd.name as depot_name,
    gd.address as depot_address
FROM cod_requests cr
JOIN gpg_depots gd ON cr.requested_depot_id = gd.id
WHERE cr.status = 'PENDING_PAYMENT'
  AND cr.cod_fee > 0
LIMIT 3;

-- 7. Summary status
SELECT 
    'MIGRATION SUMMARY' as summary,
    (SELECT COUNT(*) FROM gpg_depots) as gpg_depots_count,
    (SELECT COUNT(*) FROM cod_requests WHERE status = 'PENDING_PAYMENT') as pending_payment_count,
    (SELECT COUNT(*) FROM organization_prepaid_funds WHERE balance > 0) as funded_orgs_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM gpg_depots) > 0 
         AND (SELECT COUNT(*) FROM cod_requests WHERE status = 'PENDING_PAYMENT') > 0
         AND (SELECT COUNT(*) FROM organization_prepaid_funds WHERE balance > 0) > 0
        THEN '🎉 READY FOR TESTING'
        ELSE '⚠️ INCOMPLETE SETUP'
    END as status; 