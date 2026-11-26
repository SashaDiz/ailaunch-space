#!/usr/bin/env node
/**
 * Read-only badge audit: how live listings got their dofollow and what the
 * weekly re-check has done to them. Usage:
 *   node --env-file=.env.local scripts/badge-audit.cjs
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase
    .from('apps')
    .select('id, slug, status, plan, link_type, dofollow_status, dofollow_reason, payment_status, backlink_verified, backlink_url, backlink_last_checked_at, backlink_warning_sent_at, backlink_check_claimed_at, created_at')
    .limit(5000);
  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }
  const groups = {};
  for (const row of data) {
    const k = [row.status, row.plan, row.link_type, row.dofollow_reason ?? 'null'].join(' | ');
    groups[k] = (groups[k] || 0) + 1;
  }
  console.log('status | plan | link_type | dofollow_reason  → count');
  for (const [k, v] of Object.entries(groups).sort((a, b) => b[1] - a[1])) console.log(`  ${k}  → ${v}`);

  const dofollowStandard = data.filter(r => r.status === 'live' && r.plan === 'standard' && r.link_type === 'dofollow');
  console.log(`\nLive standard dofollow: ${dofollowStandard.length}`);
  const byLastCheck = {};
  for (const r of dofollowStandard) {
    const day = r.backlink_last_checked_at ? r.backlink_last_checked_at.slice(0, 10) : 'never';
    byLastCheck[day] = (byLastCheck[day] || 0) + 1;
  }
  console.log('backlink_last_checked_at (day → count):', byLastCheck);
  console.log('with warning sent:', dofollowStandard.filter(r => r.backlink_warning_sent_at).length);
  console.log('with stuck lease:', dofollowStandard.filter(r => r.backlink_check_claimed_at).length);
  console.log('no backlink_url:', dofollowStandard.filter(r => !r.backlink_url).length);
  console.log('archived (all):', data.filter(r => r.status === 'archived').length);
  console.log('\nsample slugs:', dofollowStandard.slice(0, 40).map(r => `${r.slug}[${r.dofollow_reason ?? 'null'}]`).join(', '));
}

main();
