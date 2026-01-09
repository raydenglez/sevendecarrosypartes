-- Update the badge award function to include review badges
CREATE OR REPLACE FUNCTION public.award_review_badges()
RETURNS TRIGGER AS $$
DECLARE
  review_count INTEGER;
BEGIN
  -- Count reviews by this user
  SELECT COUNT(*) INTO review_count FROM public.reviews WHERE reviewer_id = NEW.reviewer_id;
  
  -- First review badge
  IF review_count = 1 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.reviewer_id, 'first_review', 'Voice Heard', 'Left your first review', 'message-circle')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  -- 5 reviews badge
  IF review_count = 5 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.reviewer_id, 'five_reviews', 'Feedback Pro', 'Left 5 reviews', 'star')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  -- 10 reviews badge
  IF review_count = 10 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.reviewer_id, 'ten_reviews', 'Community Voice', 'Left 10 reviews', 'megaphone')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  -- 25 reviews badge
  IF review_count = 25 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.reviewer_id, 'twenty_five_reviews', 'Trusted Critic', 'Left 25 reviews', 'shield-check')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  -- 50 reviews badge
  IF review_count = 50 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.reviewer_id, 'fifty_reviews', 'Review Legend', 'Left 50 reviews', 'crown')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for review badges
DROP TRIGGER IF EXISTS award_review_badges_trigger ON public.reviews;
CREATE TRIGGER award_review_badges_trigger
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.award_review_badges();

-- Update listing badges function to add more achievements
CREATE OR REPLACE FUNCTION public.award_listing_badges()
RETURNS TRIGGER AS $$
DECLARE
  listing_count INTEGER;
  active_count INTEGER;
  vehicle_sold_count INTEGER;
  part_sold_count INTEGER;
  total_sold_count INTEGER;
BEGIN
  -- First listing badge
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    SELECT COUNT(*) INTO listing_count FROM public.listings WHERE owner_id = NEW.owner_id;
    IF listing_count = 1 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'first_listing', 'First Steps', 'Created your first listing', 'rocket')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- 5 listings badge
    IF listing_count = 5 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'five_listings', 'Rising Star', 'Created 5 listings', 'trending-up')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- 10 listings badge
    IF listing_count = 10 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'ten_listings', 'Power Seller', 'Created 10 listings', 'zap')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- 25 listings badge
    IF listing_count = 25 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'twenty_five_listings', 'Super Seller', 'Created 25 listings', 'flame')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- 50 listings badge
    IF listing_count = 50 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'fifty_listings', 'Elite Dealer', 'Created 50 listings', 'gem')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
  END IF;
  
  -- Sold badges
  IF TG_OP = 'UPDATE' AND NEW.status = 'sold' AND OLD.status != 'sold' THEN
    -- Vehicle sold badges
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
      IF vehicle_sold_count = 10 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.owner_id, 'ten_vehicles_sold', 'Auto King', 'Sold 10 vehicles', 'crown')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
    END IF;
    
    -- Part sold badges
    IF NEW.type = 'part' THEN
      SELECT COUNT(*) INTO part_sold_count FROM public.listings WHERE owner_id = NEW.owner_id AND status = 'sold' AND type = 'part';
      IF part_sold_count = 1 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.owner_id, 'first_part_sold', 'Parts Expert', 'Sold your first part', 'wrench')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
      IF part_sold_count = 10 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.owner_id, 'ten_parts_sold', 'Parts Master', 'Sold 10 parts', 'settings')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
    END IF;
    
    -- Total sold milestones
    SELECT COUNT(*) INTO total_sold_count FROM public.listings WHERE owner_id = NEW.owner_id AND status = 'sold';
    IF total_sold_count = 10 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'ten_total_sold', 'Deal Maker', 'Completed 10 sales', 'handshake')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    IF total_sold_count = 25 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'twenty_five_sold', 'Sales Champion', 'Completed 25 sales', 'medal')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    IF total_sold_count = 50 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'fifty_sold', 'Legendary Seller', 'Completed 50 sales', 'sparkles')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    IF total_sold_count = 100 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.owner_id, 'hundred_sold', 'Hall of Fame', 'Completed 100 sales', 'award')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS award_listing_badges_trigger ON public.listings;
CREATE TRIGGER award_listing_badges_trigger
AFTER INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.award_listing_badges();