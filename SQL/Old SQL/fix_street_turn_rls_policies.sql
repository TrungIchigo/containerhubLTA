-- Fix RLS policies for street_turn_requests table
-- Run this in Supabase SQL Editor

-- First, let's check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'street_turn_requests';

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Involved parties can view requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Trucking companies can create requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Shipping lines can update (approve/decline) requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Organizations can view their requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Users can create marketplace requests" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Organizations can update their approval status" ON public.street_turn_requests;
DROP POLICY IF EXISTS "Shipping lines can update requests" ON public.street_turn_requests;

-- Create helper function to get current organization ID
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_org_id() TO authenticated;

-- 1. Policy for SELECT - Allow users to view requests they're involved in
CREATE POLICY "Users can view involved requests" ON public.street_turn_requests
FOR SELECT 
TO authenticated
USING (
  dropoff_trucking_org_id = public.get_current_org_id() OR
  pickup_trucking_org_id = public.get_current_org_id() OR
  approving_org_id = public.get_current_org_id()
);

-- 2. Policy for INSERT - Allow dispatchers to create requests
CREATE POLICY "Dispatchers can create requests" ON public.street_turn_requests
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Ensure user is a dispatcher
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'DISPATCHER'
    AND organization_id = dropoff_trucking_org_id
  )
  AND
  -- For internal requests, pickup_trucking_org_id must match user's org
  (
    (match_type = 'INTERNAL' AND pickup_trucking_org_id = public.get_current_org_id()) OR
    (match_type = 'MARKETPLACE' AND pickup_trucking_org_id = public.get_current_org_id())
  )
);

-- 3. Policy for UPDATE - Allow carrier admins and dispatchers to update
CREATE POLICY "Authorized users can update requests" ON public.street_turn_requests
FOR UPDATE 
TO authenticated
USING (
  -- Carrier admins can update requests they need to approve
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'CARRIER_ADMIN'
      AND organization_id = approving_org_id
    )
  ) OR
  -- Dispatchers can update their own organization's requests
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'DISPATCHER'
    ) AND (
      dropoff_trucking_org_id = public.get_current_org_id() OR
      pickup_trucking_org_id = public.get_current_org_id()
    )
  )
);

-- 4. Policy for DELETE - Allow dispatchers to delete their pending requests
CREATE POLICY "Dispatchers can delete pending requests" ON public.street_turn_requests
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'DISPATCHER'
  ) AND (
    dropoff_trucking_org_id = public.get_current_org_id() OR
    pickup_trucking_org_id = public.get_current_org_id()
  ) AND
  status = 'PENDING'
);

-- 5. Service role bypass (for system operations)
CREATE POLICY "Service role bypass" ON public.street_turn_requests
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'street_turn_requests'
ORDER BY policyname; 