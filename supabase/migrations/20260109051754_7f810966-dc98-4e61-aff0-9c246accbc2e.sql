-- Add social media columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS website_url text;

-- Recreate the public_profiles view to include social links
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
  user_type,
  business_category,
  bio,
  instagram_url,
  whatsapp_number,
  website_url
FROM public.profiles
WHERE is_banned = false OR is_banned IS NULL;