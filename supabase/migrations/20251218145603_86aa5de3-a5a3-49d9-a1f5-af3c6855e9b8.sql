-- Add new listing statuses for moderation
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'rejected';

-- Create enum for report reasons
CREATE TYPE report_reason AS ENUM ('spam', 'inappropriate', 'scam', 'misleading', 'counterfeit', 'other');

-- Create enum for report status
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed');

-- Create enum for moderation actions
CREATE TYPE moderation_action AS ENUM ('approved', 'rejected', 'flagged', 'pending');

-- Create reports table for user reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason report_reason NOT NULL,
  description text,
  status report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  reviewer_notes text
);

-- Create AI moderation results table
CREATE TABLE public.ai_moderation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  is_flagged boolean NOT NULL DEFAULT false,
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  flags text[] DEFAULT '{}',
  recommendation text,
  explanation text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create moderation logs table for audit trail
CREATE TABLE public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  moderator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action moderation_action NOT NULL,
  reason text,
  ai_confidence_score numeric(3,2),
  ai_flags text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_moderation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports table
CREATE POLICY "Users can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_id AND
  NOT EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = listing_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view own reports"
ON public.reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- RLS Policies for ai_moderation_results table
CREATE POLICY "Admins can view AI moderation results"
ON public.ai_moderation_results
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Service can insert AI moderation results"
ON public.ai_moderation_results
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for moderation_logs table
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admins can create moderation logs"
ON public.moderation_logs
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator')
);

-- Create indexes for better query performance
CREATE INDEX idx_reports_listing_id ON public.reports(listing_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_ai_moderation_listing_id ON public.ai_moderation_results(listing_id);
CREATE INDEX idx_moderation_logs_listing_id ON public.moderation_logs(listing_id);
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);