-- Add pinned_badges column to profiles table to store up to 5 pinned badge IDs
ALTER TABLE public.profiles 
ADD COLUMN pinned_badges uuid[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.pinned_badges IS 'Array of up to 5 badge IDs that the user has pinned to showcase on their profile';