-- =====================================================
-- FIX AUTH ISSUES AND ORGANIZATION DUPLICATES
-- Script to resolve "Anonymous sign-ins are disabled" and duplicate organization names
-- =====================================================

-- Step 1: Check current auth settings
SELECT 
  'Checking auth.users table structure' as check_type,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- Step 2: Check for duplicate organizations
SELECT 
  'Checking duplicate organizations' as check_type,
  name,
  type,
  COUNT(*) as duplicate_count
FROM public.organizations 
GROUP BY name, type 
HAVING COUNT(*) > 1;

-- Step 3: Create function to merge duplicate organizations (if needed)
CREATE OR REPLACE FUNCTION merge_duplicate_organizations()
RETURNS TABLE (
  action_taken TEXT,
  organization_name TEXT,
  kept_id UUID,
  merged_ids UUID[]
) AS $$
DECLARE
  org_record RECORD;
  kept_org_id UUID;
  duplicate_ids UUID[];
BEGIN
  -- Find and merge duplicate organizations
  FOR org_record IN 
    SELECT name, type, array_agg(id ORDER BY created_at) as ids
    FROM public.organizations 
    GROUP BY name, type 
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) organization
    kept_org_id := org_record.ids[1];
    duplicate_ids := org_record.ids[2:];
    
    -- Update profiles to point to the kept organization
    UPDATE public.profiles 
    SET organization_id = kept_org_id 
    WHERE organization_id = ANY(duplicate_ids);
    
    -- Update any other tables that reference organizations
    -- Add more UPDATE statements here if there are other tables
    
    -- Delete duplicate organizations
    DELETE FROM public.organizations 
    WHERE id = ANY(duplicate_ids);
    
    -- Return the action taken
    RETURN QUERY 
    SELECT 
      'Merged duplicates'::TEXT as action_taken,
      org_record.name as organization_name,
      kept_org_id as kept_id,
      duplicate_ids as merged_ids;
  END LOOP;
  
  -- If no duplicates found
  IF NOT FOUND THEN
    RETURN QUERY 
    SELECT 
      'No duplicates found'::TEXT as action_taken,
      ''::TEXT as organization_name,
      NULL::UUID as kept_id,
      ARRAY[]::UUID[] as merged_ids;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add unique constraint to prevent future duplicates (if not exists)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_name_type_unique'
  ) THEN
    -- Add unique constraint on name + type combination
    ALTER TABLE public.organizations 
    ADD CONSTRAINT organizations_name_type_unique 
    UNIQUE (name, type);
  END IF;
END $$;

-- Step 5: Create function to enable email confirmation for development
CREATE OR REPLACE FUNCTION enable_email_confirmation_for_dev()
RETURNS TEXT AS $$
BEGIN
  -- Enable all unconfirmed users (DEVELOPMENT ONLY)
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE email_confirmed_at IS NULL;
  
  RETURN 'Email confirmation enabled for all users';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to check auth configuration
CREATE OR REPLACE FUNCTION check_auth_config()
RETURNS TABLE (
  setting_name TEXT,
  current_value TEXT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    'Auth Users'::TEXT as setting_name,
    COUNT(*)::TEXT || ' total users' as current_value,
    'Check if users can sign up'::TEXT as recommendation
  FROM auth.users;
  
  RETURN QUERY 
  SELECT 
    'Email Confirmation'::TEXT as setting_name,
    CASE 
      WHEN COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) > 0 
      THEN COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END)::TEXT || ' unconfirmed users'
      ELSE 'All users confirmed'
    END as current_value,
    'Run enable_email_confirmation_for_dev() for development'::TEXT as recommendation
  FROM auth.users;
  
  RETURN QUERY 
  SELECT 
    'Organizations'::TEXT as setting_name,
    COUNT(*)::TEXT || ' organizations' as current_value,
    'Check for duplicates with provided function'::TEXT as recommendation
  FROM public.organizations;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Instructions for running the fixes
/*
=== INSTRUCTIONS FOR FIXING AUTH ISSUES ===

1. First, check current state:
   SELECT * FROM check_auth_config();

2. If you have duplicate organizations, run:
   SELECT * FROM merge_duplicate_organizations();

3. For development, if you need to enable email confirmation:
   SELECT enable_email_confirmation_for_dev();

4. Check Supabase Dashboard Settings:
   - Go to Authentication > Settings
   - Ensure "Enable email confirmations" is OFF for development
   - Ensure "Enable sign ups" is ON
   - Check that email provider is properly configured

5. If you still get "Anonymous sign-ins are disabled":
   - Check Authentication > Providers
   - Ensure "Email" provider is enabled
   - Disable "Confirm email" option for development

6. Alternative: Create users manually if auto-signup fails:
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'test@example.com',
     crypt('password123', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW()
   );

=== TROUBLESHOOTING TIPS ===

- If organization duplicate errors persist, check that the unique constraint is properly applied
- If auth errors continue, verify RLS policies allow INSERT operations
- Check Supabase logs in Dashboard > Logs for detailed error messages
- For production, enable email confirmation and proper auth flows

*/ 