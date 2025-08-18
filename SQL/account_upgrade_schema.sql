-- Account Management Upgrade: Add phone_number and avatar_url to profiles table
-- Date: 2025-01-17
-- Description: Add new columns to support enhanced account management features

-- Add phone_number column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add avatar_url column to profiles table  
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN public.profiles.phone_number IS 'User phone number for contact information';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user avatar image stored in Supabase Storage';

-- Create index on phone_number for potential future queries
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;