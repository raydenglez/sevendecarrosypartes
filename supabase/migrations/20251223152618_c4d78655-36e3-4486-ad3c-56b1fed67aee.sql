-- Create notification templates table
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  target_audience text NOT NULL DEFAULT 'all',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for admins only
CREATE POLICY "Admins can view all templates"
ON public.notification_templates
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create templates"
ON public.notification_templates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE POLICY "Admins can update templates"
ON public.notification_templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
ON public.notification_templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_notification_templates_admin ON public.notification_templates (admin_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();