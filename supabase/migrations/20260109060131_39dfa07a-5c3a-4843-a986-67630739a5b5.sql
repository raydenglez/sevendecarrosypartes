-- Create function to award messaging and engagement badges
CREATE OR REPLACE FUNCTION public.award_messaging_badges()
RETURNS TRIGGER AS $$
DECLARE
  response_time_seconds INTEGER;
  prev_message RECORD;
  conversation_count INTEGER;
  fast_response_count INTEGER;
  total_messages_sent INTEGER;
BEGIN
  -- Get the previous message in this conversation (from the other user)
  SELECT * INTO prev_message
  FROM public.messages
  WHERE conversation_id = NEW.conversation_id
    AND sender_id != NEW.sender_id
    AND created_at < NEW.created_at
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate response time if there was a previous message
  IF prev_message.id IS NOT NULL THEN
    response_time_seconds := EXTRACT(EPOCH FROM (NEW.created_at - prev_message.created_at));
    
    -- Lightning Fast badge (respond within 30 seconds)
    IF response_time_seconds <= 30 THEN
      INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
      VALUES (NEW.sender_id, 'lightning_responder', 'Lightning Fast', 'Responded to a message within 30 seconds', 'zap')
      ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Quick Responder badge (respond within 5 minutes)
    IF response_time_seconds <= 300 THEN
      -- Count how many quick responses this user has made
      SELECT COUNT(*) INTO fast_response_count
      FROM public.messages m1
      JOIN public.messages m2 ON m1.conversation_id = m2.conversation_id 
        AND m2.sender_id != m1.sender_id 
        AND m2.created_at < m1.created_at
      WHERE m1.sender_id = NEW.sender_id
        AND EXTRACT(EPOCH FROM (m1.created_at - m2.created_at)) <= 300;
      
      IF fast_response_count >= 10 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.sender_id, 'quick_responder', 'Quick Responder', 'Consistently replies within 5 minutes', 'clock')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
      
      IF fast_response_count >= 50 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.sender_id, 'speed_demon', 'Speed Demon', 'Master of quick replies - 50+ fast responses', 'timer')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
      
      IF fast_response_count >= 100 THEN
        INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
        VALUES (NEW.sender_id, 'always_online', 'Always Online', 'Legendary responder - 100+ quick replies', 'wifi')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  -- Count total conversations for this user
  SELECT COUNT(DISTINCT id) INTO conversation_count
  FROM public.conversations
  WHERE seller_id = NEW.sender_id OR buyer_id = NEW.sender_id;
  
  -- Conversation milestone badges
  IF conversation_count >= 1 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.sender_id, 'first_conversation', 'Ice Breaker', 'Started your first conversation', 'message-square')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF conversation_count >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.sender_id, 'social_butterfly', 'Social Butterfly', 'Active in 10+ conversations', 'users')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF conversation_count >= 25 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.sender_id, 'networking_pro', 'Networking Pro', 'Connected with 25+ people', 'network')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF conversation_count >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.sender_id, 'community_pillar', 'Community Pillar', 'A cornerstone of the community - 50+ connections', 'heart-handshake')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  -- Total messages sent badges
  SELECT COUNT(*) INTO total_messages_sent
  FROM public.messages
  WHERE sender_id = NEW.sender_id;
  
  IF total_messages_sent >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.sender_id, 'chatty', 'Chatty', 'Sent 50+ messages', 'message-circle')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF total_messages_sent >= 200 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.sender_id, 'super_communicator', 'Super Communicator', 'Sent 200+ messages', 'messages-square')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF total_messages_sent >= 500 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.sender_id, 'chat_legend', 'Chat Legend', 'Sent 500+ messages', 'mail')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for messaging badges
DROP TRIGGER IF EXISTS award_messaging_badges_trigger ON public.messages;
CREATE TRIGGER award_messaging_badges_trigger
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.award_messaging_badges();

-- Update profile badges to include loyalty/tenure badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  account_age_days INTEGER;
BEGIN
  -- Profile completed badge
  IF NEW.full_name IS NOT NULL AND NEW.avatar_url IS NOT NULL AND NEW.location_city IS NOT NULL AND NEW.bio IS NOT NULL THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.id, 'profile_complete', 'Profile Pro', 'Completed your profile with all details', 'user-check')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  -- Calculate account age
  account_age_days := EXTRACT(DAY FROM (now() - NEW.created_at));
  
  -- Loyalty badges based on account age
  IF account_age_days >= 7 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.id, 'one_week', 'Week Warrior', 'Member for 1 week', 'calendar')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF account_age_days >= 30 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.id, 'one_month', 'Monthly Member', 'Member for 1 month', 'calendar-days')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF account_age_days >= 90 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.id, 'three_months', 'Seasoned Seller', 'Member for 3 months', 'calendar-check')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF account_age_days >= 180 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.id, 'six_months', 'Half Year Hero', 'Member for 6 months', 'calendar-heart')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  IF account_age_days >= 365 THEN
    INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_description, badge_icon)
    VALUES (NEW.id, 'one_year', 'Anniversary Legend', 'Member for 1 year', 'cake')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;