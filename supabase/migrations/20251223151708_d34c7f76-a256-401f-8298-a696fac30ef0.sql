-- Add 'scheduled' to the broadcast_status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'scheduled' AND enumtypid = 'broadcast_status'::regtype) THEN
    ALTER TYPE public.broadcast_status ADD VALUE 'scheduled';
  END IF;
END $$;