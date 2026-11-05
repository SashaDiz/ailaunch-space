-- ============================================================================
-- One-time ad placements
-- ============================================================================
-- Advertising moves from monthly subscriptions to a single payment that fixes
-- a spot for 30 days. Sponsor logos become one more placement of `promotions`,
-- so there is one product, one checkout and one admin list.
--
--   * starts_at / ends_at   the paid period; `ends_at` NULL means open-ended
--                           (house ads, subscriptions sold before this change)
--   * is_house              our own ads: fill empty spots, never block a sale
--   * placement_logo        the logo row on the homepage
--   * wordmark_url          transparent logo for that row
--   * payment_id            the Dodo payment; unique, so webhook retries no-op
--   * legacy_partner_id     links a row to `partners` for old subscriptions
--
-- `placement_catalog` keeps its name but now means the side rails: renaming a
-- column read by the running deployment would break it mid-rollout.
-- `partners` is left in place (unused) and can be dropped once this has shipped.
-- Idempotent.
-- ============================================================================

ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS placement_logo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wordmark_url TEXT,
  ADD COLUMN IF NOT EXISTS is_house BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid INTEGER,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS legacy_partner_id UUID;

ALTER TABLE public.promotions DROP CONSTRAINT IF EXISTS promotions_status_check;
ALTER TABLE public.promotions ADD CONSTRAINT promotions_status_check
  CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'past_due', 'paused', 'rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_payment_id
  ON public.promotions(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotions_status_ends_at
  ON public.promotions(status, ends_at);

-- Anything live that was not bought through a subscription was created in the
-- admin panel, so it is a house ad.
UPDATE public.promotions
SET is_house = true
WHERE status = 'active' AND subscription_id IS NULL AND payment_id IS NULL;

-- Sponsors become logo placements. Subscribed ones stay paid; the rest are ours.
INSERT INTO public.promotions (
  user_id, name, short_description, logo_url, wordmark_url, website_url,
  placement_logo, status, is_house, subscription_id, customer_id,
  subscription_started_at, subscription_ends_at,
  current_period_start, current_period_end,
  position, legacy_partner_id
)
SELECT
  p.user_id, p.name, p.description, p.logo, p.logo, COALESCE(p.website_url, ''),
  true, p.status, p.subscription_id IS NULL, p.subscription_id, p.customer_id,
  p.subscription_started_at, p.subscription_ends_at,
  p.current_period_start, p.current_period_end,
  COALESCE(p.position, 0), p.id
FROM public.partners p
WHERE p.status IN ('active', 'past_due', 'paused')
  AND NOT EXISTS (
    SELECT 1 FROM public.promotions existing WHERE existing.legacy_partner_id = p.id
  );
