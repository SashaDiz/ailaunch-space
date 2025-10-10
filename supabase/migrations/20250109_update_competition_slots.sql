-- Migration: Update competition slot limits to reflect shared slot system
-- Date: 2025-01-09
-- Description: 
--   Changes the slot system from separate pools to shared slots:
--   - Standard and Premium SHARE the first 15 slots
--   - Premium gets 10 EXTRA slots (total 25 slots for premium)
--   - Updates max_premium_slots from 999 to 25 for all existing competitions

-- Update all existing competitions to use the new slot limit
UPDATE public.competitions
SET 
  max_premium_slots = 25,
  updated_at = NOW()
WHERE 
  type = 'weekly' 
  AND max_premium_slots != 25;

-- Add comments to the table for clarity
COMMENT ON COLUMN public.competitions.total_submissions IS 'Total submissions from both standard and premium plans';
COMMENT ON COLUMN public.competitions.standard_submissions IS 'Count of standard plan submissions (for analytics only)';
COMMENT ON COLUMN public.competitions.premium_submissions IS 'Count of premium plan submissions (for analytics only)';
COMMENT ON COLUMN public.competitions.max_standard_slots IS 'Shared slots available for both standard and premium plans (15)';
COMMENT ON COLUMN public.competitions.max_premium_slots IS 'Total slots available for premium plans only (25 = 15 shared + 10 extra)';

