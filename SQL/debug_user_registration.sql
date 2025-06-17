-- =====================================================
-- DEBUG USER REGISTRATION ISSUES
-- Script to check and clean up user registration problems
-- =====================================================

-- Step 1: Check all users in auth.users table
SELECT 
  'All Auth Users' as check_type,
  id,
  email,
  email_confirmed_at,
  created_at,
  user_metadata
FROM auth.users 
ORDER BY created_at DESC
LIMIT 20;

-- Step 2: Check for specific email
SELECT 
  'Checking specific email' as check_type,
  id,
  email,
  email_confirmed_at,
  created_at,
  user_metadata,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'haxuantrung396@gmail.com';

-- Step 3: Check for users without profiles
SELECT 
  'Users without profiles' as check_type,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- Step 4: Check for orphaned users (no organization link)
SELECT 
  'Orphaned users' as check_type,
  u.id,
  u.email,
  u.user_metadata->>'pending_organization_id' as pending_org_id,
  u.user_metadata->>'organization_id' as org_id,
  u.user_metadata->>'full_name' as full_name
FROM auth.users u
WHERE u.user_metadata->>'pending_organization_id' IS NOT NULL
   OR u.user_metadata->>'organization_id' IS NOT NULL;

-- Step 5: Clean up function for problematic users
CREATE OR REPLACE FUNCTION cleanup_problematic_users(target_email TEXT DEFAULT NULL)
RETURNS TABLE (
  action_taken TEXT,
  user_id UUID,
  user_email TEXT,
  details TEXT
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- If specific email provided, clean only that user
  IF target_email IS NOT NULL THEN
    FOR user_record IN 
      SELECT id, email, user_metadata FROM auth.users WHERE email = target_email
    LOOP
      -- Delete user from auth.users
      DELETE FROM auth.users WHERE id = user_record.id;
      
      -- Delete associated profile if exists
      DELETE FROM public.profiles WHERE id = user_record.id;
      
      -- Delete associated organization if pending
      IF user_record.user_metadata->>'pending_organization_id' IS NOT NULL THEN
        DELETE FROM public.organizations 
        WHERE id = (user_record.user_metadata->>'pending_organization_id')::UUID
          AND status = 'PENDING_VERIFICATION';
      END IF;
      
      RETURN QUERY 
      SELECT 
        'Cleaned up user and related data'::TEXT as action_taken,
        user_record.id as user_id,
        user_record.email as user_email,
        'Deleted user, profile, and pending organization'::TEXT as details;
    END LOOP;
  ELSE
    -- Clean up all users without profiles older than 1 hour
    FOR user_record IN 
      SELECT u.id, u.email, u.user_metadata 
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE p.id IS NULL 
        AND u.created_at < NOW() - INTERVAL '1 hour'
        AND u.email_confirmed_at IS NULL
    LOOP
      -- Delete user and related data
      DELETE FROM auth.users WHERE id = user_record.id;
      DELETE FROM public.profiles WHERE id = user_record.id;
      
      IF user_record.user_metadata->>'pending_organization_id' IS NOT NULL THEN
        DELETE FROM public.organizations 
        WHERE id = (user_record.user_metadata->>'pending_organization_id')::UUID
          AND status = 'PENDING_VERIFICATION';
      END IF;
      
      RETURN QUERY 
      SELECT 
        'Cleaned up orphaned user'::TEXT as action_taken,
        user_record.id as user_id,
        user_record.email as user_email,
        'Removed incomplete registration'::TEXT as details;
    END LOOP;
  END IF;
  
  -- If no users found to clean
  IF NOT FOUND THEN
    RETURN QUERY 
    SELECT 
      'No users found to clean'::TEXT as action_taken,
      NULL::UUID as user_id,
      target_email as user_email,
      'No problematic users detected'::TEXT as details;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Function to check registration status
CREATE OR REPLACE FUNCTION check_registration_status(check_email TEXT)
RETURNS TABLE (
  status_type TEXT,
  found BOOLEAN,
  details TEXT,
  recommendation TEXT
) AS $$
DECLARE
  auth_user_exists BOOLEAN := FALSE;
  profile_exists BOOLEAN := FALSE;
  org_pending BOOLEAN := FALSE;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = check_email) INTO auth_user_exists;
  
  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p 
    JOIN auth.users u ON p.id = u.id 
    WHERE u.email = check_email
  ) INTO profile_exists;
  
  -- Check if pending organization exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users u 
    WHERE u.email = check_email 
      AND u.user_metadata->>'pending_organization_id' IS NOT NULL
  ) INTO org_pending;
  
  -- Return status based on findings
  IF auth_user_exists AND profile_exists THEN
    RETURN QUERY SELECT 
      'Complete Registration'::TEXT,
      TRUE,
      'User has auth account and profile'::TEXT,
      'User can login normally'::TEXT;
      
  ELSIF auth_user_exists AND org_pending THEN
    RETURN QUERY SELECT 
      'Pending Approval'::TEXT,
      TRUE,
      'User exists but organization pending approval'::TEXT,
      'Wait for admin approval or cleanup user'::TEXT;
      
  ELSIF auth_user_exists AND NOT profile_exists THEN
    RETURN QUERY SELECT 
      'Incomplete Registration'::TEXT,
      TRUE,
      'User exists but no profile created'::TEXT,
      'Cleanup user or complete registration process'::TEXT;
      
  ELSE
    RETURN QUERY SELECT 
      'No Registration'::TEXT,
      FALSE,
      'User does not exist in system'::TEXT,
      'Safe to register with this email'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
-- To check current status of problematic email:
SELECT * FROM check_registration_status('haxuantrung396@gmail.com');

-- To see all users without profiles:
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.user_metadata
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- To clean up specific problematic user:
SELECT * FROM cleanup_problematic_users('haxuantrung396@gmail.com');

-- To clean up all orphaned users:
SELECT * FROM cleanup_problematic_users();

-- To manually delete a specific user:
DELETE FROM auth.users WHERE email = 'haxuantrung396@gmail.com';
*/ 