-- Create verification_requests table for ID verification
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id_photo_url TEXT NOT NULL,
  selfie_with_id_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table for achievement badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification_requests
CREATE POLICY "Users can view own verification requests"
ON public.verification_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests"
ON public.verification_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- RLS policies for user_badges
CREATE POLICY "Everyone can view user badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "System can insert badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false);

-- Storage policies for verification documents
CREATE POLICY "Users can upload own verification docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own verification docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all verification docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-documents' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)));

-- Function to award badge when user completes actions
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS TRIGGER AS $$
BEGIN
  -- Profile completed badge
  IF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.full_name IS NOT NULL AND NEW.avatar_url IS NOT NULL AND NEW.location_city IS NOT NULL AND NEW.bio IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.id, 'profile_complete', 'Profile Pro', 'Completed your profile with all details', 'user-check')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for profile completion
CREATE TRIGGER check_profile_badges
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();

-- Function to award listing badges
CREATE OR REPLACE FUNCTION public.award_listing_badges()
RETURNS TRIGGER AS $$
DECLARE
  listing_count INTEGER;
  vehicle_sold_count INTEGER;
  part_sold_count INTEGER;
BEGIN
  -- First listing badge
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    SELECT COUNT(*) INTO listing_count FROM public.listings WHERE owner_id = NEW.owner_id AND status = 'active';
    IF listing_count = 1 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'first_listing', 'First Steps', 'Created your first listing', 'package')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- 10 listings badge
    IF listing_count = 10 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'ten_listings', 'Power Seller', 'Created 10 listings', 'zap')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
  END IF;
  
  -- Sold badges
  IF TG_OP = 'UPDATE' AND NEW.status = 'sold' AND OLD.status != 'sold' THEN
    IF NEW.type = 'vehicle' THEN
      SELECT COUNT(*) INTO vehicle_sold_count FROM public.listings WHERE owner_id = NEW.owner_id AND status = 'sold' AND type = 'vehicle';
      IF vehicle_sold_count = 1 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.owner_id, 'first_vehicle_sold', 'First Wheels', 'Sold your first vehicle', 'car')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
      IF vehicle_sold_count = 5 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.owner_id, 'five_vehicles_sold', 'Car Dealer', 'Sold 5 vehicles', 'trophy')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
    END IF;
    
    IF NEW.type = 'part' THEN
      SELECT COUNT(*) INTO part_sold_count FROM public.listings WHERE owner_id = NEW.owner_id AND status = 'sold' AND type = 'part';
      IF part_sold_count = 1 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.owner_id, 'first_part_sold', 'Parts Expert', 'Sold your first part', 'wrench')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for listing badges
CREATE TRIGGER award_listing_badges_trigger
AFTER INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.award_listing_badges();