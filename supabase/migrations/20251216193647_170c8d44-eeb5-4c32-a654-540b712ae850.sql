-- Grant SELECT permissions on public_profiles view to authenticated and anon roles
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;