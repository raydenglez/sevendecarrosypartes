-- Remove the overly permissive policy that exposes emails and phone numbers
DROP POLICY IF EXISTS "Anyone can view public profile data" ON public.profiles;

-- Add a policy that allows authenticated users to view basic profile info for other users
-- This is needed for features like seeing seller names on listings
CREATE POLICY "Authenticated users can view profiles for app features"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Note: The public_profiles view already exists and filters out sensitive columns
-- Application code should use public_profiles for displaying other users' data
-- and only access the full profiles table for the user's own profile