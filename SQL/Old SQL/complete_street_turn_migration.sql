-- Complete migration for street_turn_requests table
-- Run this step by step in Supabase SQL Editor

-- Step 1: Check what we're working with
SELECT 'Current schema check:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'street_turn_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE match_type AS ENUM ('INTERNAL', 'MARKETPLACE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE party_approval_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Handle the requesting_org_id -> dropoff_trucking_org_id transition
DO $$ 
DECLARE
    has_requesting_org BOOLEAN;
    has_dropoff_org BOOLEAN;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'street_turn_requests' 
        AND column_name = 'requesting_org_id'
        AND table_schema = 'public'
    ) INTO has_requesting_org;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'street_turn_requests' 
        AND column_name = 'dropoff_trucking_org_id'
        AND table_schema = 'public'
    ) INTO has_dropoff_org;
    
    -- Rename if needed
    IF has_requesting_org AND NOT has_dropoff_org THEN
        ALTER TABLE public.street_turn_requests 
        RENAME COLUMN requesting_org_id TO dropoff_trucking_org_id;
        RAISE NOTICE 'Renamed requesting_org_id to dropoff_trucking_org_id';
    END IF;
    
    -- Add missing columns
    IF NOT has_dropoff_org AND NOT has_requesting_org THEN
        ALTER TABLE public.street_turn_requests 
        ADD COLUMN dropoff_trucking_org_id UUID NOT NULL REFERENCES public.organizations(id);
        RAISE NOTICE 'Added dropoff_trucking_org_id column';
    END IF;
END $$;

-- Step 4: Add other missing columns
ALTER TABLE public.street_turn_requests 
ADD COLUMN IF NOT EXISTS pickup_trucking_org_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.street_turn_requests 
ADD COLUMN IF NOT EXISTS match_type match_type NOT NULL DEFAULT 'INTERNAL';

ALTER TABLE public.street_turn_requests 
ADD COLUMN IF NOT EXISTS dropoff_org_approval_status party_approval_status DEFAULT 'APPROVED';

ALTER TABLE public.street_turn_requests 
ADD COLUMN IF NOT EXISTS auto_approved_by_rule_id UUID REFERENCES public.auto_approval_rules(id);

ALTER TABLE public.street_turn_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.street_turn_requests 
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Step 5: Update existing data
UPDATE public.street_turn_requests 
SET 
    pickup_trucking_org_id = dropoff_trucking_org_id,
    dropoff_org_approval_status = 'APPROVED',
    match_type = 'INTERNAL'
WHERE pickup_trucking_org_id IS NULL;

-- Step 6: Create get_current_org_id function
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id 
  FROM public.profiles 
  WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_current_org_id() TO authenticated;

-- Step 7: Enable RLS if not already enabled
ALTER TABLE public.street_turn_requests ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop old policies
DROP POLICY IF EXISTS "Involved parties can view requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Trucking companies can create requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Shipping lines can update (approve/decline) requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Organizations can view their requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Users can create marketplace requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Organizations can update their approval status" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Shipping lines can update requests" ON public.street_turn_requests;

-- Step 9: Create new RLS policies
CREATE POLICY "Users can view involved requests" ON public.street_turn_requests
FOR SELECT 
TO authenticated
USING (
  dropoff_trucking_org_id = public.get_current_org_id() OR
  pickup_trucking_org_id = public.get_current_org_id() OR
  approving_org_id = public.get_current_org_id()
);

CREATE POLICY "Dispatchers can create requests" ON public.street_turn_requests
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'DISPATCHER'
    AND organization_id = dropoff_trucking_org_id
  )
);

CREATE POLICY "Authorized users can update requests" ON public.street_turn_requests
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      (role = 'CARRIER_ADMIN' AND organization_id = approving_org_id) OR
      (role = 'DISPATCHER' AND (
        organization_id = dropoff_trucking_org_id OR
        organization_id = pickup_trucking_org_id
      ))
    )
  )
);

CREATE POLICY "Dispatchers can delete pending requests" ON public.street_turn_requests
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'DISPATCHER'
    AND (
      organization_id = dropoff_trucking_org_id OR
      organization_id = pickup_trucking_org_id
    )
  ) AND
  status = 'PENDING'
);

-- Service role bypass
CREATE POLICY "Service role bypass" ON public.street_turn_requests
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Step 10: Verify final result
SELECT 'Migration completed. Final schema:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'street_turn_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 