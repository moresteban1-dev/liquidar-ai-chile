-- Enable REPLICA IDENTITY FULL for quotations to get full old/new payload
ALTER TABLE public.quotations REPLICA IDENTITY FULL;

-- Check if supabase_realtime publication exists, if so add table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'quotations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
    END IF;
END $$;
