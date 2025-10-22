-- Add avatar_url column to users table
-- This migration adds the avatar_url field to store user profile images

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.avatar_url IS 'URL of the user profile image stored in Supabase Storage';
