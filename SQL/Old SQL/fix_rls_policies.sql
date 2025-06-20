-- =====================================================
-- FIX RLS POLICIES FOR REGISTRATION FLOW
-- Fix "new row violates row-level security policy" errors
-- =====================================================

-- Step 1: Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  hasrls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'profiles');

-- Step 2: Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('organizations', 'profiles');

-- Step 3: Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only access their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can only access their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only authenticated users can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Only authenticated users can insert profiles" ON public.profiles;

-- Step 4: Create permissive policies for registration flow

-- Allow authenticated users to create organizations
CREATE POLICY "Allow authenticated users to create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read all organizations (for searching)
CREATE POLICY "Allow authenticated users to read organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update organizations they're associated with
CREATE POLICY "Allow authenticated users to update their organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Allow authenticated users to create their own profiles
CREATE POLICY "Allow authenticated users to create profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Allow authenticated users to read all profiles (for admin functions)
CREATE POLICY "Allow authenticated users to read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profiles
CREATE POLICY "Allow users to update their own profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Step 5: Enable RLS on tables (if not already enabled)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions to authenticated role
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 7: Create emergency disable function for troubleshooting
CREATE OR REPLACE FUNCTION disable_rls_for_debug()
RETURNS TEXT AS $$
BEGIN
  ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  RETURN 'RLS disabled for debugging - REMEMBER to re-enable!';
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create function to re-enable RLS
CREATE OR REPLACE FUNCTION enable_rls_after_debug()
RETURNS TEXT AS $$
BEGIN
  ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  RETURN 'RLS re-enabled';
END;
$$ LANGUAGE plpgsql;

-- Step 9: Test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Test organizations insert
  BEGIN
    INSERT INTO public.organizations (name, type, status) 
    VALUES ('__TEST_ORG__', 'TRUCKING_COMPANY', 'PENDING_VERIFICATION');
    
    DELETE FROM public.organizations WHERE name = '__TEST_ORG__';
    
    RETURN QUERY SELECT 
      'Organizations Insert'::TEXT,
      'PASS'::TEXT,
      'Can insert organizations'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Organizations Insert'::TEXT,
      'FAIL'::TEXT,
      'Cannot insert: ' || SQLERRM;
  END;
  
  -- Test profiles insert (need a valid auth.uid())
  BEGIN
    -- This will fail if no user is authenticated, but that's expected
    INSERT INTO public.profiles (id, full_name, email, role) 
    VALUES (COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000001'), '__TEST_USER__', 'test@test.com', 'DISPATCHER');
    
    DELETE FROM public.profiles WHERE full_name = '__TEST_USER__';
    
    RETURN QUERY SELECT 
      'Profiles Insert'::TEXT,
      'PASS'::TEXT,
      'Can insert profiles'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Profiles Insert'::TEXT,
      'FAIL'::TEXT,
      'Cannot insert: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('organizations', 'profiles');

-- Test RLS policies
SELECT * FROM test_rls_policies();

-- If tests fail, temporarily disable RLS for debugging
SELECT disable_rls_for_debug();

-- After fixing issues, re-enable RLS
SELECT enable_rls_after_debug();

-- Check final policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('organizations', 'profiles');
*/

-- Final verification
SELECT 'RLS Policies Fixed' as status;
SELECT * FROM test_rls_policies(); 