-- Migration to add special_instructions column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
