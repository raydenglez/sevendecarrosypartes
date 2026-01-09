-- Drop the overly permissive INSERT policy on ai_moderation_results
-- The moderate-listing edge function uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
-- No INSERT policy needed for regular authenticated users

DROP POLICY IF EXISTS "Service can insert AI moderation results" ON public.ai_moderation_results;