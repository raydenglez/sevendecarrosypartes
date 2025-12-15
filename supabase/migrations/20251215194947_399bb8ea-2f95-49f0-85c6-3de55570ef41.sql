-- Function to update seller rating when a review is added
CREATE OR REPLACE FUNCTION public.update_seller_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_id_var uuid;
  new_avg numeric;
  new_count integer;
BEGIN
  -- Get the seller (owner) of the listing being reviewed
  SELECT owner_id INTO seller_id_var
  FROM listings
  WHERE id = NEW.listing_id;

  -- Calculate new average and count from all reviews on seller's listings
  SELECT 
    COALESCE(AVG(r.rating), 0),
    COUNT(r.id)
  INTO new_avg, new_count
  FROM reviews r
  JOIN listings l ON r.listing_id = l.id
  WHERE l.owner_id = seller_id_var;

  -- Update the seller's profile
  UPDATE profiles
  SET 
    rating_avg = ROUND(new_avg, 2),
    rating_count = new_count,
    updated_at = now()
  WHERE id = seller_id_var;

  RETURN NEW;
END;
$$;

-- Create trigger on reviews table
DROP TRIGGER IF EXISTS update_seller_rating_trigger ON reviews;
CREATE TRIGGER update_seller_rating_trigger
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_rating();