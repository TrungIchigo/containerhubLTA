-- Migration: Add decline_reason field to street_turn_requests table
-- Run this script in Supabase SQL Editor

-- Add decline_reason field to store reason for declining requests
ALTER TABLE public.street_turn_requests 
ADD COLUMN decline_reason TEXT;

-- Add comment to explain the purpose of this field
COMMENT ON COLUMN public.street_turn_requests.decline_reason IS 'Reason provided by carrier admin when declining a street-turn request';

-- Optionally, you can add an updated_at field if it doesn't exist
-- This will track when the request was last modified
ALTER TABLE public.street_turn_requests 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment for updated_at field
COMMENT ON COLUMN public.street_turn_requests.updated_at IS 'Timestamp when the request was last updated';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'street_turn_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 