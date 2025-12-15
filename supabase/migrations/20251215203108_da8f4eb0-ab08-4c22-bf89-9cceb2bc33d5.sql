-- Create function to recalculate premium status for vehicles (top 10% by price)
CREATE OR REPLACE FUNCTION recalculate_vehicle_premium()
RETURNS void AS $$
DECLARE
  threshold numeric;
BEGIN
  -- Calculate 90th percentile (top 10%) threshold for vehicles
  SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY price)
  INTO threshold
  FROM listings
  WHERE type = 'vehicle' 
    AND status = 'active' 
    AND price IS NOT NULL 
    AND price > 0;
  
  -- Reset all vehicles to non-premium
  UPDATE listings
  SET is_premium = false
  WHERE type = 'vehicle' AND status = 'active';
  
  -- Mark top 10% as premium (if threshold exists)
  IF threshold IS NOT NULL THEN
    UPDATE listings
    SET is_premium = true
    WHERE type = 'vehicle' 
      AND status = 'active' 
      AND price >= threshold;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;