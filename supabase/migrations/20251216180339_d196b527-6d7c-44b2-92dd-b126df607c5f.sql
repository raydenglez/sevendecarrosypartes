-- Create a public view for vehicle attributes that excludes VIN
CREATE VIEW public.public_vehicle_attributes 
WITH (security_invoker = true)
AS
SELECT 
  id,
  listing_id,
  make,
  model,
  year,
  mileage,
  fuel_type,
  transmission,
  color,
  condition
FROM public.vehicle_attributes;

-- Grant SELECT on the view
GRANT SELECT ON public.public_vehicle_attributes TO anon, authenticated;