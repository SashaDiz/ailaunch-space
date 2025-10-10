-- Add 'draft' status to apps table
-- This migration adds draft functionality for failed or abandoned submissions

-- Update the status check constraint to include 'draft'
ALTER TABLE public.apps DROP CONSTRAINT IF EXISTS apps_status_check;
ALTER TABLE public.apps ADD CONSTRAINT apps_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'live', 'archived', 'scheduled', 'draft'));

-- Add is_draft boolean field for easier querying
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

-- Create index for draft queries
CREATE INDEX IF NOT EXISTS idx_apps_is_draft ON public.apps(is_draft);

-- Update existing unpaid premium submissions to draft status
UPDATE public.apps 
SET status = 'draft', is_draft = true
WHERE plan = 'premium' 
  AND payment_status = false 
  AND status = 'pending';

-- Update RLS policies to allow users to view their own drafts
-- Users can view their own drafts (including existing policy)
CREATE POLICY "Users can view own draft apps" ON public.apps
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = submitted_by AND is_draft = true);

-- Users can update their own drafts
CREATE POLICY "Users can update own draft apps" ON public.apps
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = submitted_by AND is_draft = true);

-- Users can delete their own drafts
CREATE POLICY "Users can delete own draft apps" ON public.apps
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = submitted_by AND is_draft = true);

COMMENT ON COLUMN public.apps.is_draft IS 'True if this is a saved draft (e.g., abandoned premium submission or validation failure)';

