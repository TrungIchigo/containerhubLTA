-- =====================================================
-- ADMIN DASHBOARD SCHEMA UPDATES
-- Add new roles, statuses, and fields for admin approval flow
-- =====================================================

-- Step 1: Add PLATFORM_ADMIN role to user_role enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'PLATFORM_ADMIN') THEN
        ALTER TYPE public.user_role ADD VALUE 'PLATFORM_ADMIN';
    END IF;
END $$;

-- Step 2: Add new organization statuses
DO $$
BEGIN
    -- Add PENDING_ADMIN_APPROVAL status
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'organization_status' AND e.enumlabel = 'PENDING_ADMIN_APPROVAL') THEN
        ALTER TYPE public.organization_status ADD VALUE 'PENDING_ADMIN_APPROVAL';
    END IF;
    
    -- Add REJECTED status
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'organization_status' AND e.enumlabel = 'REJECTED') THEN
        ALTER TYPE public.organization_status ADD VALUE 'REJECTED';
    END IF;
END $$;

-- Step 3: Add admin rejection reason column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'admin_rejection_reason') THEN
        ALTER TABLE public.organizations
        ADD COLUMN admin_rejection_reason TEXT;
    END IF;
END $$;

-- Step 4: Add admin approval tracking columns
DO $$
BEGIN
    -- Add approved_by column to track which admin approved
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'approved_by') THEN
        ALTER TABLE public.organizations
        ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add approved_at timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'approved_at') THEN
        ALTER TABLE public.organizations
        ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add rejected_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'rejected_by') THEN
        ALTER TABLE public.organizations
        ADD COLUMN rejected_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add rejected_at timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'rejected_at') THEN
        ALTER TABLE public.organizations
        ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Step 5: Create admin dashboard functions
CREATE OR REPLACE FUNCTION get_pending_organizations()
RETURNS TABLE (
    id UUID,
    name TEXT,
    type organization_type,
    business_license_number TEXT,
    address TEXT,
    phone_number TEXT,
    status organization_status,
    created_at TIMESTAMP WITH TIME ZONE,
    representative_email TEXT,
    representative_name TEXT,
    representative_phone TEXT,
    user_full_name TEXT,
    user_email TEXT,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.type,
        o.business_license_number,
        o.address,
        o.phone_number,
        o.status,
        o.created_at,
        o.representative_email,
        o.representative_name,
        o.representative_phone,
        p.full_name as user_full_name,
        p.email as user_email,
        p.id as user_id
    FROM public.organizations o
    LEFT JOIN public.profiles p ON p.organization_id = o.id
    WHERE o.status = 'PENDING_ADMIN_APPROVAL'
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create function to get organization details for admin review
CREATE OR REPLACE FUNCTION get_organization_for_admin_review(org_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type organization_type,
    business_license_number TEXT,
    address TEXT,
    phone_number TEXT,
    status organization_status,
    created_at TIMESTAMP WITH TIME ZONE,
    representative_email TEXT,
    representative_name TEXT,
    representative_phone TEXT,
    admin_rejection_reason TEXT,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID,
    rejected_at TIMESTAMP WITH TIME ZONE,
    user_full_name TEXT,
    user_email TEXT,
    user_id UUID,
    user_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.type,
        o.business_license_number,
        o.address,
        o.phone_number,
        o.status,
        o.created_at,
        o.representative_email,
        o.representative_name,
        o.representative_phone,
        o.admin_rejection_reason,
        o.approved_by,
        o.approved_at,
        o.rejected_by,
        o.rejected_at,
        p.full_name as user_full_name,
        p.email as user_email,
        p.id as user_id,
        p.created_at as user_created_at
    FROM public.organizations o
    LEFT JOIN public.profiles p ON p.organization_id = o.id
    WHERE o.id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create admin statistics function
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
    pending_count INTEGER,
    active_count INTEGER,
    rejected_count INTEGER,
    total_count INTEGER,
    today_registrations INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN status = 'PENDING_ADMIN_APPROVAL' THEN 1 END)::INTEGER as pending_count,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END)::INTEGER as active_count,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END)::INTEGER as rejected_count,
        COUNT(*)::INTEGER as total_count,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::INTEGER as today_registrations
    FROM public.organizations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create RLS policies for admin functions
CREATE POLICY "Allow platform admin to manage organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'PLATFORM_ADMIN'
    )
);

-- Step 9: Grant permissions to authenticated role for admin functions
GRANT EXECUTE ON FUNCTION get_pending_organizations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_for_admin_review(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats() TO authenticated;

-- Step 10: Create function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'PLATFORM_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_platform_admin(UUID) TO authenticated;

-- Step 11: Create sample admin user setup function
CREATE OR REPLACE FUNCTION create_sample_admin_profile(admin_email TEXT, admin_name TEXT)
RETURNS TEXT AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin already exists
    SELECT id INTO admin_user_id
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
        RETURN 'Admin user not found in auth.users. Please create user first in Supabase Dashboard.';
    END IF;
    
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id) THEN
        RETURN 'Admin profile already exists.';
    END IF;
    
    -- Create admin profile
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (admin_user_id, admin_name, admin_email, 'PLATFORM_ADMIN');
    
    RETURN 'Admin profile created successfully for: ' || admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructions for creating admin user
/*
=== ADMIN USER SETUP INSTRUCTIONS ===

1. Go to Supabase Dashboard → Authentication → Users → "Add user"
2. Create user with your email and password
3. Note the User ID (UUID)
4. Run this function with your details:

SELECT create_sample_admin_profile('your-email@example.com', 'Your Full Name');

5. Verify admin access:

SELECT * FROM public.profiles WHERE role = 'PLATFORM_ADMIN';

=== VERIFICATION QUERIES ===

-- Check admin dashboard stats
SELECT * FROM get_admin_dashboard_stats();

-- Check pending organizations
SELECT * FROM get_pending_organizations();

-- Test admin permissions
SELECT is_platform_admin(); -- Should return true when logged in as admin

*/

SELECT 'Admin Dashboard Schema Updated Successfully' as status; 