-- Remove the overly permissive SELECT policy that exposes VINs to everyone
DROP POLICY IF EXISTS "Vehicle attrs viewable by everyone" ON public.vehicle_attributes;

-- Add a policy that only allows owners to see their vehicle attributes (including VIN)
-- This ensures only the listing owner can see the VIN
CREATE POLICY "Owners can view own vehicle attrs"
ON public.vehicle_attributes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings
    WHERE listings.id = vehicle_attributes.listing_id
    AND listings.owner_id = auth.uid()
  )
);

-- Note: The existing public_vehicle_attributes view (which excludes VIN column) 
-- should be used for public listings display