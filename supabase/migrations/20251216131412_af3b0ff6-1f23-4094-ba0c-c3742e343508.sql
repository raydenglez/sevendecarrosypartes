-- Add language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.language IS 'User preferred language code: en, es, pt';