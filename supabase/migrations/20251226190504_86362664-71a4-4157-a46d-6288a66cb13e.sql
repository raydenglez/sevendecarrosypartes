-- Add expires_at column for owner-set expiration dates
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add last_bumped_at column to track when listing was last bumped/refreshed
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS last_bumped_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Set initial last_bumped_at for existing listings based on created_at
UPDATE public.listings 
SET last_bumped_at = COALESCE(updated_at, created_at)
WHERE last_bumped_at IS NULL;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_listings_last_bumped_at ON public.listings(last_bumped_at);
CREATE INDEX IF NOT EXISTS idx_listings_expires_at ON public.listings(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_status_type ON public.listings(status, type);