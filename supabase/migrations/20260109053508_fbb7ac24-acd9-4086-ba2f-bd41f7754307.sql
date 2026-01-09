-- Fix: Recreate public_profiles view with security_invoker = true
-- This ensures RLS policies on the profiles table are properly enforced

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
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

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;