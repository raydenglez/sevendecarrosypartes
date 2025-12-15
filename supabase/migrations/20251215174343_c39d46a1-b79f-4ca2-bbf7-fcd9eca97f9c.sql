-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload listing images
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listings' 
  AND auth.uid() IS NOT NULL
);

-- Allow public read access to listing images
CREATE POLICY "Listing images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

-- Allow users to delete their own listing images
CREATE POLICY "Users can delete own listing images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own listing images
CREATE POLICY "Users can update own listing images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'listings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);