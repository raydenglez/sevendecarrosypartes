-- Drop and recreate the view with SECURITY INVOKER (safer default)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url,
  is_verified,
  location_city,
  location_state,
  rating_avg,
  rating_count,
  user_type,
  created_at
FROM public.profiles;

-- Grant SELECT on the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;