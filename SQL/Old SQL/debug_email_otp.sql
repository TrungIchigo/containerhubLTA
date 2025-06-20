-- =====================================================
-- DEBUG EMAIL OTP CONFIGURATION
-- Script to diagnose OTP email sending issues
-- =====================================================

-- Check auth.users table for recent signups
SELECT 
  'Recent Signups' as check_type,
  email,
  created_at,
  email_confirmed_at,
  confirmation_sent_at,
  last_sign_in_at,
  raw_user_meta_data,
  user_metadata
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Check if there are any pending email confirmations
SELECT 
  'Pending Confirmations' as check_type,
  COUNT(*) as total_pending,
  MIN(created_at) as oldest_pending,
  MAX(created_at) as newest_pending
FROM auth.users 
WHERE email_confirmed_at IS NULL 
  AND created_at > NOW() - INTERVAL '7 days';

-- Debug function to test email sending
CREATE OR REPLACE FUNCTION debug_email_configuration()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  details TEXT,
  recommendation TEXT
) AS $$
BEGIN
  -- Test 1: Check recent auth attempts
  BEGIN
    RETURN QUERY 
    SELECT 
      'Recent Auth Activity'::TEXT,
      'INFO'::TEXT,
      'Found ' || COUNT(*)::TEXT || ' users created in last 24 hours',
      CASE 
        WHEN COUNT(*) = 0 THEN 'No recent signups - this is normal'
        ELSE 'Recent signup activity detected'
      END
    FROM auth.users 
    WHERE created_at > NOW() - INTERVAL '1 day';
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Recent Auth Activity'::TEXT,
      'ERROR'::TEXT,
      'Cannot access auth.users: ' || SQLERRM,
      'Check database permissions'::TEXT;
  END;
  
  -- Test 2: Check email confirmation rates
  BEGIN
    RETURN QUERY
    WITH stats AS (
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
      FROM auth.users 
      WHERE created_at > NOW() - INTERVAL '7 days'
    )
    SELECT 
      'Email Confirmation Rate'::TEXT,
      CASE 
        WHEN total_users = 0 THEN 'NO_DATA'
        WHEN confirmed_users::float / total_users > 0.5 THEN 'GOOD'
        ELSE 'POOR'
      END,
      'Confirmed: ' || confirmed_users || '/' || total_users || ' (' || 
      ROUND((confirmed_users::float / NULLIF(total_users, 0) * 100)::numeric, 1) || '%)',
      CASE 
        WHEN total_users = 0 THEN 'No data available'
        WHEN confirmed_users::float / total_users > 0.5 THEN 'Email delivery appears to be working'
        ELSE 'Low confirmation rate - check SMTP configuration'
      END
    FROM stats;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Email Confirmation Rate'::TEXT,
      'ERROR'::TEXT,
      'Error calculating rates: ' || SQLERRM,
      'Check query logic'::TEXT;
  END;
  
  -- Test 3: Check for users with specific test email
  BEGIN
    RETURN QUERY
    SELECT 
      'Test Email Check'::TEXT,
      CASE 
        WHEN COUNT(*) > 0 THEN 'FOUND'
        ELSE 'NOT_FOUND'
      END,
      'Found ' || COUNT(*) || ' users with test email patterns',
      CASE 
        WHEN COUNT(*) > 0 THEN 'Test accounts exist - check their confirmation status'
        ELSE 'No test accounts found'
      END
    FROM auth.users 
    WHERE email LIKE '%test%' OR email LIKE '%tempmail%' OR email LIKE '%debug%';
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
      'Test Email Check'::TEXT,
      'ERROR'::TEXT,
      'Error checking test emails: ' || SQLERRM,
      'Check query permissions'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up test users
CREATE OR REPLACE FUNCTION cleanup_test_users()
RETURNS TABLE (
  action TEXT,
  email TEXT,
  status TEXT
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find test users created in last 24 hours that are unconfirmed
  FOR user_record IN 
    SELECT id, email, created_at 
    FROM auth.users 
    WHERE (email LIKE '%test%' OR email LIKE '%tempmail%' OR email LIKE '%debug%')
      AND email_confirmed_at IS NULL
      AND created_at > NOW() - INTERVAL '1 day'
  LOOP
    BEGIN
      -- Note: In a real app, you'd need admin privileges to delete auth users
      -- This is just a placeholder for the logic
      RETURN QUERY SELECT 
        'CLEANUP'::TEXT,
        user_record.email,
        'IDENTIFIED_FOR_CLEANUP'::TEXT;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        'CLEANUP'::TEXT,
        user_record.email,
        'ERROR: ' || SQLERRM;
    END;
  END LOOP;
  
  -- If no test users found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'CLEANUP'::TEXT,
      'N/A'::TEXT,
      'NO_TEST_USERS_FOUND'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check specific email status
CREATE OR REPLACE FUNCTION check_email_status(target_email TEXT)
RETURNS TABLE (
  check_type TEXT,
  value TEXT,
  interpretation TEXT
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user record for the email
  SELECT id, email, created_at, email_confirmed_at, confirmation_sent_at, 
         last_sign_in_at, raw_user_meta_data 
  INTO user_record
  FROM auth.users 
  WHERE email = target_email;
  
  IF FOUND THEN
    RETURN QUERY SELECT 'User Exists', 'YES', 'User found in auth.users table';
    RETURN QUERY SELECT 'User ID', user_record.id::TEXT, 'Unique identifier';
    RETURN QUERY SELECT 'Created At', user_record.created_at::TEXT, 'Account creation time';
    RETURN QUERY SELECT 'Email Confirmed', 
      COALESCE(user_record.email_confirmed_at::TEXT, 'NO'), 
      CASE WHEN user_record.email_confirmed_at IS NULL 
           THEN 'Email not confirmed - OTP not verified' 
           ELSE 'Email confirmed successfully' END;
    RETURN QUERY SELECT 'Confirmation Sent', 
      COALESCE(user_record.confirmation_sent_at::TEXT, 'UNKNOWN'), 
      'Last time confirmation email was sent';
    RETURN QUERY SELECT 'Last Sign In', 
      COALESCE(user_record.last_sign_in_at::TEXT, 'NEVER'), 
      'User login activity';
    RETURN QUERY SELECT 'User Metadata', 
      COALESCE(user_record.raw_user_meta_data::TEXT, 'EMPTY'), 
      'Additional user data stored during signup';
  ELSE
    RETURN QUERY SELECT 'User Exists', 'NO', 'No user found with this email';
    RETURN QUERY SELECT 'Recommendation', 'CREATE_NEW', 'Safe to create new account with this email';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

/*
-- Check overall email configuration
SELECT * FROM debug_email_configuration();

-- Check specific email status
SELECT * FROM check_email_status('test@example.com');

-- Clean up test users
SELECT * FROM cleanup_test_users();

-- Manual checks
SELECT email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'your-test-email@example.com';

-- Check recent signups
SELECT email, created_at, email_confirmed_at, confirmation_sent_at
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
*/

-- Quick diagnostic
SELECT 'Email Debug Summary' as title;
SELECT * FROM debug_email_configuration(); 