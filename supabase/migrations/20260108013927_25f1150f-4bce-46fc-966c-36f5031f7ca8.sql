-- Drop the overly permissive policy that exposes all profile data to anyone
DROP POLICY IF EXISTS "Anyone can view public profile data" ON profiles;