-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add username to public_profiles view
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  username,
  avatar_url,
  rating_avg,
  rating_count,
  location_city,
  location_state,
  is_verified,
  created_at,
  user_type
FROM public.profiles
WHERE is_banned = false OR is_banned IS NULL;