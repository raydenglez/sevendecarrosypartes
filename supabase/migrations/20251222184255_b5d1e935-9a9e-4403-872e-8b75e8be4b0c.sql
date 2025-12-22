-- Add message type enum
CREATE TYPE message_type AS ENUM ('text', 'image', 'voice');

-- Add columns to messages table
ALTER TABLE public.messages 
  ADD COLUMN message_type message_type NOT NULL DEFAULT 'text',
  ADD COLUMN media_url TEXT,
  ADD COLUMN media_duration INTEGER;

-- Create bucket for chat media
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

-- RLS policies for chat-media bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);

-- Allow public read (since conversation participants need to see)
CREATE POLICY "Chat media is publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own chat media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);