-- =====================================================
-- FIX PROFILES RLS POLICY FOR SERVICE ROLE BYPASS
-- Allow supabaseAdmin (service_role) to bypass RLS when creating profiles
-- =====================================================

-- Check current policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Add service role bypass policy for profiles table
-- This allows the admin client (service_role) to create profiles without RLS restrictions
CREATE POLICY "Service role bypass for profiles" ON public.profiles
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Grant necessary permissions to service_role
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Verify the new policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

SELECT 'Service role bypass policy for profiles created successfully!' as status;