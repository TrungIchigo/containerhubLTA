-- =====================================================
-- REGISTER FLOW UPGRADE MIGRATION
-- Adds organization status, new fields, and fuzzy search function
-- =====================================================

-- Step 1: Create organization status enum if not exists
DO $$ BEGIN
    CREATE TYPE public.organization_status AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add new columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS tax_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS status public.organization_status NOT NULL DEFAULT 'ACTIVE';

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.organizations.name IS 'Tên công ty/tổ chức, có thể là tên đầy đủ sau khi đã đăng ký.';
COMMENT ON COLUMN public.organizations.tax_code IS 'Mã số thuế của tổ chức, phải là duy nhất.';
COMMENT ON COLUMN public.organizations.status IS 'Trạng thái của tổ chức trên hệ thống.';

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_type_status ON public.organizations(type, status);
CREATE INDEX IF NOT EXISTS idx_organizations_name_lower ON public.organizations(lower(name));

-- Step 5: Create fuzzy search function
CREATE OR REPLACE FUNCTION public.fuzzy_search_organizations(
    search_term TEXT, 
    org_type public.organization_type
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type public.organization_type,
    tax_code TEXT,
    address TEXT,
    phone_number TEXT,
    status public.organization_status,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.type,
        o.tax_code,
        o.address,
        o.phone_number,
        o.status,
        o.created_at
    FROM public.organizations o
    WHERE
        -- Fuzzy matching with ILIKE
        lower(o.name) LIKE '%' || lower(search_term) || '%'
        AND o.type = org_type
        AND o.status = 'ACTIVE'
    ORDER BY 
        -- Prioritize exact matches
        CASE 
            WHEN lower(o.name) = lower(search_term) THEN 1 
            WHEN lower(o.name) LIKE lower(search_term) || '%' THEN 2
            ELSE 3 
        END,
        -- Then by length (shorter names first for better matches)
        length(o.name),
        o.created_at DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.fuzzy_search_organizations(TEXT, public.organization_type) TO anon;
GRANT EXECUTE ON FUNCTION public.fuzzy_search_organizations(TEXT, public.organization_type) TO authenticated;

-- Step 7: Test the function with sample data
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Test if function works
    SELECT COUNT(*) INTO test_count 
    FROM public.fuzzy_search_organizations('test', 'TRUCKING_COMPANY');
    
    RAISE NOTICE 'Function test completed. Found % results for test search.', test_count;
END $$;

-- Step 8: Update existing organizations to have ACTIVE status if NULL
UPDATE public.organizations 
SET status = 'ACTIVE' 
WHERE status IS NULL;

SELECT 'Register flow migration completed successfully!' as status; 