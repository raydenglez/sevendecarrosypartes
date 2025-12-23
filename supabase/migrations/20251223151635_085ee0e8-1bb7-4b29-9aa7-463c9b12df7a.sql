-- Add scheduled_for column to broadcast_notifications
ALTER TABLE public.broadcast_notifications 
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone NULL;