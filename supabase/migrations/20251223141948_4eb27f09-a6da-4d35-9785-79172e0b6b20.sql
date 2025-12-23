-- Create enum for target audience
CREATE TYPE broadcast_target AS ENUM ('all', 'sellers', 'buyers', 'verified_users');

-- Create enum for broadcast status
CREATE TYPE broadcast_status AS ENUM ('pending', 'sending', 'completed', 'failed');

-- Create broadcast_notifications table
CREATE TABLE public.broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_audience broadcast_target NOT NULL DEFAULT 'all',
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status broadcast_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view broadcast notifications
CREATE POLICY "Admins can view broadcast notifications"
ON public.broadcast_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create broadcast notifications
CREATE POLICY "Admins can create broadcast notifications"
ON public.broadcast_notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = admin_id);

-- Only admins can update broadcast notifications (for status updates)
CREATE POLICY "Admins can update broadcast notifications"
ON public.broadcast_notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_broadcast_notifications_created_at ON public.broadcast_notifications(created_at DESC);
CREATE INDEX idx_broadcast_notifications_status ON public.broadcast_notifications(status);