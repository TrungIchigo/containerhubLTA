-- Fix street_turn_requests schema for missing fields
-- Run this in Supabase SQL Editor

-- Check current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'street_turn_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist

-- Ensure dropoff_trucking_org_id exists (renamed from requesting_org_id)
DO $$ BEGIN
  -- Check if requesting_org_id exists and dropoff_trucking_org_id doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'street_turn_requests' 
    AND column_name = 'requesting_org_id'
    AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'street_turn_requests' 
    AND column_name = 'dropoff_trucking_org_id'
    AND table_schema = 'public'
  ) THEN
    -- Rename existing column
    ALTER TABLE public.street_turn_requests 
    RENAME COLUMN requesting_org_id TO dropoff_trucking_org_id;
  END IF;
END $$;

-- Add pickup_trucking_org_id if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'street_turn_requests' 
    AND column_name = 'pickup_trucking_org_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.street_turn_requests 
    ADD COLUMN pickup_trucking_org_id UUID REFERENCES public.organizations(id);
  END IF;
END $$;

-- Add match_type if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'street_turn_requests' 
    AND column_name = 'match_type'
    AND table_schema = 'public'
  ) THEN
    -- Create enum if not exists
    CREATE TYPE IF NOT EXISTS match_type AS ENUM ('INTERNAL', 'MARKETPLACE');
    
    ALTER TABLE public.street_turn_requests 
    ADD COLUMN match_type match_type NOT NULL DEFAULT 'INTERNAL';
  END IF;
END $$;

-- Add dropoff_org_approval_status if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'street_turn_requests' 
    AND column_name = 'dropoff_org_approval_status'
    AND table_schema = 'public'
  ) THEN
    -- Create enum if not exists
    CREATE TYPE IF NOT EXISTS party_approval_status AS ENUM ('PENDING', 'APPROVED', 'DECLINED');
    
    ALTER TABLE public.street_turn_requests 
    ADD COLUMN dropoff_org_approval_status party_approval_status;
  END IF;
END $$;

-- Add auto_approved_by_rule_id if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'street_turn_requests' 
    AND column_name = 'auto_approved_by_rule_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.street_turn_requests 
    ADD COLUMN auto_approved_by_rule_id UUID;
  END IF;
END $$;

-- Add updated_at if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'street_turn_requests' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.street_turn_requests 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing rows for internal requests
UPDATE public.street_turn_requests 
SET pickup_trucking_org_id = dropoff_trucking_org_id,
    dropoff_org_approval_status = 'APPROVED'
WHERE pickup_trucking_org_id IS NULL 
  AND match_type = 'INTERNAL';

-- Verify the final schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'street_turn_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 