-- Verify Organizations Table Schema
-- Script để kiểm tra và fix schema của bảng organizations

-- 1. Kiểm tra columns hiện tại của bảng organizations
SELECT 
    'Current organizations table columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Kiểm tra xem có column 'type' không
SELECT 
    'Check type column exists' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'type'
            AND table_schema = 'public'
        ) THEN 'YES - type column exists'
        ELSE 'NO - type column missing'
    END as result;

-- 3. Kiểm tra xem có column 'organization_type' không (should not exist)
SELECT 
    'Check organization_type column exists' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'organizations' 
            AND column_name = 'organization_type'
            AND table_schema = 'public'
        ) THEN 'WARNING - organization_type column exists (should not)'
        ELSE 'GOOD - organization_type column does not exist'
    END as result;

-- 4. Nếu có organization_type column, rename nó thành type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'organization_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.organizations RENAME COLUMN organization_type TO type;
        RAISE NOTICE 'Renamed organization_type column to type';
    ELSE
        RAISE NOTICE 'No organization_type column found, schema is correct';
    END IF;
END $$;

-- 5. Verify data trong type column
SELECT 
    'Organization types in database' as info,
    type,
    COUNT(*) as count
FROM public.organizations
WHERE type IS NOT NULL
GROUP BY type
ORDER BY count DESC;

-- 6. Sample organizations để verify data
SELECT 
    'Sample organizations' as info,
    id,
    name,
    type,
    status,
    created_at
FROM public.organizations
ORDER BY created_at DESC
LIMIT 5;

-- 7. Verify billing queries work
SELECT 
    'Test billing query - transactions' as info,
    COUNT(*) as transaction_count
FROM public.transactions t
LEFT JOIN public.organizations o ON t.payer_org_id = o.id;

SELECT 
    'Test billing query - invoices' as info,
    COUNT(*) as invoice_count  
FROM public.invoices i
LEFT JOIN public.organizations o ON i.organization_id = o.id;

-- 8. Success message
DO $$
BEGIN
    RAISE NOTICE '=== ORGANIZATIONS SCHEMA VERIFICATION COMPLETED ===';
    RAISE NOTICE 'Check the query results above for any issues';
    RAISE NOTICE 'If type column exists and has data, billing should work now';
END $$; 