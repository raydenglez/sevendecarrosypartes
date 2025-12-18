-- Add sponsored_until column for time-limited sponsorships
ALTER TABLE public.listings 
ADD COLUMN sponsored_until timestamp with time zone;

-- Create index for efficient expiration queries
CREATE INDEX idx_listings_sponsored_until ON public.listings(sponsored_until) WHERE sponsored_until IS NOT NULL;