-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create policy for users to view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a view for public profile data (excludes sensitive columns like email, phone)
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Grant SELECT on the view to authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO anon, authenticated;