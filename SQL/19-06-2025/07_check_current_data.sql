-- Check current data in COD fee related tables

-- 1. Check GPG depots
SELECT 'GPG Depots Count' as table_name, COUNT(*) as count FROM public.gpg_depots
UNION ALL
-- 2. Check all depots  
SELECT 'All Depots Count', COUNT(*) FROM public.depots
UNION ALL
-- 3. Check current GPG COD fee matrix
SELECT 'GPG COD Fee Matrix Count', COUNT(*) FROM public.gpg_cod_fee_matrix;

-- Show sample GPG depots
SELECT 'GPG DEPOTS SAMPLE:' as info, id, name, address FROM public.gpg_depots LIMIT 5;

-- Show sample all depots (non-GPG)
SELECT 'ALL DEPOTS SAMPLE:' as info, id, name, address FROM public.depots 
WHERE id NOT IN (SELECT id FROM public.gpg_depots) LIMIT 5;

-- Show current fee matrix routes
SELECT 'CURRENT FEE ROUTES:' as info, origin_depot_id, destination_depot_id, fee 
FROM public.gpg_cod_fee_matrix LIMIT 10; 