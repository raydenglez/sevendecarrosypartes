-- Drop and recreate public_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles WITH (security_invoker = true) AS
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
FROM profiles
WHERE (is_banned = false) OR (is_banned IS NULL);

-- Grant access to the view for anon and authenticated roles
GRANT SELECT ON public_profiles TO anon, authenticated;