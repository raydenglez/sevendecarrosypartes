-- Allow anyone to view public profile data (the public_profiles view filters sensitive columns)
CREATE POLICY "Anyone can view public profile data"
ON profiles
FOR SELECT
TO authenticated, anon
USING (true);