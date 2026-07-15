-- ============================================================================
-- Dodo Payments migration
-- ============================================================================
-- The platform's payment provider is Dodo Payments (Merchant of Record).
-- The `partners` and `promotions` tables previously stored provider ids in
-- Stripe-flavored columns (`stripe_subscription_id`, `stripe_customer_id`).
-- Rename them to provider-neutral names and refresh the related indexes.
--
-- Idempotent: each rename only runs if the old column is still present, so a
-- fresh database (created from the updated schema.sql, which already uses the
-- new names) skips the renames cleanly.
-- ============================================================================

-- partners --------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partners'
      AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.partners RENAME COLUMN stripe_subscription_id TO subscription_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'partners'
      AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.partners RENAME COLUMN stripe_customer_id TO customer_id;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_partners_stripe_subscription_id;
CREATE INDEX IF NOT EXISTS idx_partners_subscription_id ON public.partners(subscription_id);

-- promotions ------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promotions'
      AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.promotions RENAME COLUMN stripe_subscription_id TO subscription_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'promotions'
      AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.promotions RENAME COLUMN stripe_customer_id TO customer_id;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_promotions_stripe_subscription_id;
CREATE INDEX IF NOT EXISTS idx_promotions_subscription_id ON public.promotions(subscription_id);
