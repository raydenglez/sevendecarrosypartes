-- Fix profiles table RLS: Remove overly permissive policy that exposes email/phone
-- Application code uses public_profiles view which filters sensitive columns

DROP POLICY IF EXISTS "Authenticated users can view profiles for app features" ON public.profiles;

-- Note: The existing "Users can view own profile" policy (auth.uid() = id) remains
-- This ensures users can only access their own full profile data
-- Other users' data should be accessed through the public_profiles view