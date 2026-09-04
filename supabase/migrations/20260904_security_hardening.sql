-- ============================================================================
-- Security hardening
--
-- Apply in the Supabase SQL Editor. Idempotent: safe to run more than once.
--
-- Two findings, both ported from the upstream boilerplate audit:
--
--   F-10  the public SELECT policy on `apps` has no TO clause, so it applies to
--         `anon` — and an RLS policy grants EVERY column of a matching row.
--         `apps.contact_email` is therefore readable by anyone holding the
--         publishable key, which ships in the client bundle by design.
--
--   F-17  admin RLS policies test only `role = 'admin'`, while the app's own
--         checkIsAdmin() (lib/supabase/auth.ts) also accepts `is_admin = true`.
--         The database and the application disagreeing about who is an admin is
--         how privilege bugs start.
--
-- The application reads through the service-role client, which bypasses RLS, so
-- neither change affects server-side data access.
-- ============================================================================


-- ── F-17: admin policies must accept both admin signals ─────────────────────

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = (select auth.uid())
      and (role = 'admin' or is_admin = true)
  );
$$;

grant execute on function public.is_admin_user() to authenticated;

-- Rewrite every admin policy that still tests `role = 'admin'` alone.
do $$
declare
  pol record;
  new_expr text := 'public.is_admin_user()';
begin
  for pol in
    select schemaname, tablename, policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual like '%role%admin%' or with_check like '%role%admin%')
      and policyname ilike '%admin%'
  loop
    execute format('drop policy if exists %I on %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);

    if pol.cmd = 'SELECT' then
      execute format('create policy %I on %I.%I for select to authenticated using (%s)',
                     pol.policyname, pol.schemaname, pol.tablename, new_expr);
    elsif pol.cmd = 'UPDATE' then
      execute format('create policy %I on %I.%I for update to authenticated using (%s) with check (%s)',
                     pol.policyname, pol.schemaname, pol.tablename, new_expr, new_expr);
    elsif pol.cmd = 'DELETE' then
      execute format('create policy %I on %I.%I for delete to authenticated using (%s)',
                     pol.policyname, pol.schemaname, pol.tablename, new_expr);
    elsif pol.cmd = 'INSERT' then
      execute format('create policy %I on %I.%I for insert to authenticated with check (%s)',
                     pol.policyname, pol.schemaname, pol.tablename, new_expr);
    else -- ALL
      execute format('create policy %I on %I.%I for all to authenticated using (%s) with check (%s)',
                     pol.policyname, pol.schemaname, pol.tablename, new_expr, new_expr);
    end if;
  end loop;
end $$;


-- ── F-10: stop exposing contact details to the anon key ─────────────────────
-- Public pages get a view with the display columns only. Excluded on purpose:
-- contact_email, submitted_by, checkout_session_id, order_id, payment_* and the
-- moderation fields.

create or replace view public.apps_public
with (security_invoker = true)
as
  select
    id, slug, name, short_description, full_description,
    website_url, logo_url, screenshots, video_url,
    categories, tags, pricing, status, plan,
    maker_name, maker_twitter,
    launch_week, launch_month, launch_date,
    upvotes, views, clicks, total_engagement,
    ratings_count, average_rating, comments_count, bookmarks_count,
    featured, premium_badge, link_type,
    weekly_winner, weekly_position,
    meta_title, meta_description,
    created_at, updated_at
  from public.apps
  where status in ('live', 'approved');

grant select on public.apps_public to anon, authenticated;

-- Remove the blanket anon read of the base table. Authenticated users keep the
-- owner/admin policies already defined in schema.sql.
revoke select on public.apps from anon;

comment on view public.apps_public is
  'Anon-safe projection of public.apps — excludes contact_email, submitted_by and the payment/moderation columns.';
