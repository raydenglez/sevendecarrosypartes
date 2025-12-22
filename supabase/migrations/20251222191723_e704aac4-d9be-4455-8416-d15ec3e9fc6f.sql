-- Update the public_profiles view to include business_category and bio
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
  bio
FROM public.profiles
WHERE is_banned = false OR is_banned IS NULL;