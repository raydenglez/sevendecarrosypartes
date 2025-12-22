-- Add business_category and bio columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_category text,
ADD COLUMN IF NOT EXISTS bio text;

-- Add a comment for documentation
COMMENT ON COLUMN public.profiles.business_category IS 'User business category/role in the app';
COMMENT ON COLUMN public.profiles.bio IS 'Short user bio/description';