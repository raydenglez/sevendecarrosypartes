-- Fix storage upload policies to restrict uploads to user-owned folders only

-- Fix listings bucket INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Users can upload own listing images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listings' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix chat-media bucket INSERT policy  
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload own chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);