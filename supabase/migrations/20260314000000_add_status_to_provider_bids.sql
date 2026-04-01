-- Migration: Add status column to provider_bids
-- Description: Tracking the lifecycle of provider bids (offers)
-- Severity: Critical (Fixes insertion errors in /api/quotations/[id]/provider-quote)

ALTER TABLE provider_bids 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SUBMITTED';

-- Optional: Create an index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_provider_bids_status ON provider_bids(status);

COMMENT ON COLUMN provider_bids.status IS 'Status of the provider bid: SUBMITTED, PENDING, ACCEPTED, REJECTED';
