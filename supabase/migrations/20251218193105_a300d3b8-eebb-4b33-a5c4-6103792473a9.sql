-- Add sponsored content columns to listings table
ALTER TABLE public.listings 
ADD COLUMN is_sponsored boolean DEFAULT false,
ADD COLUMN sponsored_at timestamp with time zone,
ADD COLUMN sponsored_by uuid REFERENCES auth.users(id);

-- Create index for faster sponsored queries
CREATE INDEX idx_listings_sponsored ON public.listings(is_sponsored) WHERE is_sponsored = true;