-- Add is_banned column to profiles table for user ban functionality
ALTER TABLE public.profiles
ADD COLUMN is_banned boolean DEFAULT false;

-- Add banned_at timestamp to track when user was banned
ALTER TABLE public.profiles
ADD COLUMN banned_at timestamp with time zone DEFAULT NULL;

-- Add banned_reason to store why user was banned
ALTER TABLE public.profiles
ADD COLUMN banned_reason text DEFAULT NULL;