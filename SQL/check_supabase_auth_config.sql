-- =====================================================
-- CHECK SUPABASE AUTH CONFIGURATION
-- Script to diagnose auth configuration issues
-- =====================================================

-- Step 1: Check auth.users table access and structure
SELECT 
  'Auth Users Table Check' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
  MAX(created_at) as latest_user_created
FROM auth.users;

-- Step 2: Check RLS policies for organizations table
SELECT 
  'RLS Policies Check' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'profiles')
ORDER BY tablename, policyname;

-- Step 3: Check if anonymous users can insert
SELECT 
  'Anonymous Access Check' as check_type,
  tablename,
  privilege_type,
  grantee
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name IN ('organizations', 'profiles')
  AND grantee IN ('anon', 'authenticated', 'public');

-- Step 4: Check auth schema permissions
SELECT 
  'Auth Schema Access' as check_type,
  schemaname,
  tablename,
  tableowner,
  hasinserts,
  hasselects,
  hasupdates,
  hasdeletes
FROM pg_tables 
WHERE schemaname = 'auth';

-- Step 5: Test basic functionality
CREATE OR REPLACE FUNCTION test_auth_functionality()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  details TEXT,
  recommendation TEXT
) AS $$
BEGIN
  -- Test 1: Can access auth.users table
  BEGIN
    PERFORM COUNT(*) FROM auth.users LIMIT 1;
    RETURN QUERY SELECT 
      'Auth Users Access'::TEXT,
      'PASS'::TEXT,
      'Can access auth.users table'::TEXT,
      'No action needed'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Auth Users Access'::TEXT,
      'FAIL'::TEXT,
      'Cannot access auth.users table: ' || SQLERRM,
      'Check RLS policies and permissions'::TEXT;
  END;
  
  -- Test 2: Can insert into organizations
  BEGIN
    -- This will fail if not allowed, but that's ok for testing
    INSERT INTO public.organizations (name, type) 
    VALUES ('__TEST_ORG__', 'TRUCKING_COMPANY');
    
    -- Clean up test data
    DELETE FROM public.organizations WHERE name = '__TEST_ORG__';
    
    RETURN QUERY SELECT 
      'Organizations Insert'::TEXT,
      'PASS'::TEXT,
      'Can insert into organizations table'::TEXT,
      'No action needed'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Organizations Insert'::TEXT,
      'FAIL'::TEXT,
      'Cannot insert into organizations: ' || SQLERRM,
      'Check RLS policies for organizations table'::TEXT;
  END;
  
  -- Test 3: Can insert into profiles
  BEGIN
    INSERT INTO public.profiles (id, full_name, role) 
    VALUES ('00000000-0000-0000-0000-000000000001', '__TEST_USER__', 'DISPATCHER');
    
    DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001';
    
    RETURN QUERY SELECT 
      'Profiles Insert'::TEXT,
      'PASS'::TEXT,
      'Can insert into profiles table'::TEXT,
      'No action needed'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Profiles Insert'::TEXT,
      'FAIL'::TEXT,
      'Cannot insert into profiles: ' || SQLERRM,
      'Check RLS policies for profiles table'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to fix common auth issues
CREATE OR REPLACE FUNCTION fix_auth_configuration()
RETURNS TABLE (
  fix_applied TEXT,
  description TEXT,
  status TEXT
) AS $$
BEGIN
  -- Fix 1: Enable anonymous access to organizations table
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Enable anonymous insert for organizations" ON public.organizations';
    EXECUTE 'CREATE POLICY "Enable anonymous insert for organizations" ON public.organizations FOR INSERT TO anon WITH CHECK (true)';
    
    RETURN QUERY SELECT 
      'Anonymous Organizations Insert'::TEXT,
      'Added policy to allow anonymous users to insert organizations'::TEXT,
      'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Anonymous Organizations Insert'::TEXT,
      'Failed to add policy: ' || SQLERRM,
      'FAILED'::TEXT;
  END;
  
  -- Fix 2: Enable anonymous access to profiles table
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Enable anonymous insert for profiles" ON public.profiles';
    EXECUTE 'CREATE POLICY "Enable anonymous insert for profiles" ON public.profiles FOR INSERT TO anon WITH CHECK (true)';
    
    RETURN QUERY SELECT 
      'Anonymous Profiles Insert'::TEXT,
      'Added policy to allow anonymous users to insert profiles'::TEXT,
      'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Anonymous Profiles Insert'::TEXT,
      'Failed to add policy: ' || SQLERRM,
      'FAILED'::TEXT;
  END;
  
  -- Fix 3: Enable read access for anonymous users
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Enable anonymous select for organizations" ON public.organizations';
    EXECUTE 'CREATE POLICY "Enable anonymous select for organizations" ON public.organizations FOR SELECT TO anon USING (true)';
    
    RETURN QUERY SELECT 
      'Anonymous Organizations Select'::TEXT,
      'Added policy to allow anonymous users to read organizations'::TEXT,
      'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Anonymous Organizations Select'::TEXT,
      'Failed to add policy: ' || SQLERRM,
      'FAILED'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
-- Step 1: Check current auth configuration
SELECT * FROM test_auth_functionality();

-- Step 2: If there are failures, try to fix them
SELECT * FROM fix_auth_configuration();

-- Step 3: Check again to see if fixes worked
SELECT * FROM test_auth_functionality();

-- Step 4: Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('organizations', 'profiles');

-- Step 5: Manual fix if needed - Enable all access temporarily for debugging
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- WARNING: Only use this for debugging! Re-enable RLS after testing:
-- ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
*/

-- Quick checks you can run
SELECT 'Quick Auth Check' as title;
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT COUNT(*) as total_organizations FROM public.organizations;
SELECT COUNT(*) as total_profiles FROM public.profiles; 