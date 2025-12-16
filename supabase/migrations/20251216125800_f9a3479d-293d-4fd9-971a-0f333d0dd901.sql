-- Add privacy settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_phone_on_listings boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_messages_from_anyone boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_online_status boolean DEFAULT false;