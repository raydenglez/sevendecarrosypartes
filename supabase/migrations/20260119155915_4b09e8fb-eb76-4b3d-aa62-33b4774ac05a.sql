-- Create a function to get public profile by username (bypasses RLS for anonymous access)
CREATE OR REPLACE FUNCTION get_public_profile_by_username(p_username TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  rating_avg NUMERIC,
  rating_count INTEGER,
  location_city TEXT,
  location_state TEXT,
  is_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  user_type user_type,
  business_category TEXT,
  bio TEXT,
  instagram_url TEXT,
  whatsapp_number TEXT,
  website_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.rating_avg,
    p.rating_count,
    p.location_city,
    p.location_state,
    p.is_verified,
    p.created_at,
    p.user_type,
    p.business_category,
    p.bio,
    p.instagram_url,
    p.whatsapp_number,
    p.website_url
  FROM profiles p
  WHERE LOWER(p.username) = LOWER(p_username)
    AND (p.is_banned = false OR p.is_banned IS NULL);
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION get_public_profile_by_username TO anon, authenticated;