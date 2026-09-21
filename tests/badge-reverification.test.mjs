import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reverifyBadge, badgeEligibility } from '../lib/badge-reverification.ts';
import { badgeWarningHtml } from '../lib/badge-warning-email.ts';

function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some(clause => matches(row, clause));
    if (value && typeof value === 'object') {
      if ('$exists' in value) return (row[key] != null) === value.$exists;
      if ('$lt' in value) return row[key] != null && row[key] < value.$lt;
    }
    return (row[key] ?? null) === value;
  });
}
function fixture(overrides = {}) {
  const project = { id: 'project', ...badgeEligibility, submitted_by: 'owner',
    name: 'Example', website_url: 'https://example.com', contact_email: 'fallback@example.com',
    backlink_warning_sent_at: null, backlink_check_claimed_at: null, ...overrides };
  let now = new Date('2026-09-21T04:00:00Z');
  const messages = [];
  const deps = {
    now: () => now,
    db: {
      async findOne(table, filter) {
        if (table === 'users') return { email: 'owner@example.com' };
        return matches(project, filter) ? { ...project } : null;
      },
      async updateOne(table, filter, update) {
        if (!matches(project, filter)) return { matchedCount: 0 };
        Object.assign(project, update.$set);
        return { matchedCount: 1 };
      },
    },
    verify: async () => ({ outcome: { kind: 'not_found' } }),
    warn: async (...args) => { messages.push(args); return { success: true }; },
  };
  return { project, deps, messages, advance: days => { now = new Date(+now + days * 86400000); } };
}

test('warns once, preserves dofollow for seven days, then archives only after another negative check', async () => {
  const f = fixture();
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
  assert.equal(f.messages[0][1], 'owner@example.com');
  assert.equal(f.messages[0][2].toISOString(), '2026-09-28T04:00:00.000Z');
  assert.equal(f.project.status, 'live');
  assert.equal(f.project.link_type, 'dofollow');
  assert.equal(await reverifyBadge('project', f.deps), 'grace');
  f.advance(6);
  assert.equal(await reverifyBadge('project', f.deps), 'grace');
  f.advance(1);
  assert.equal(await reverifyBadge('project', f.deps), 'archived');
  assert.equal(f.messages.length, 1);
  assert.equal(f.project.link_type, 'nofollow');
  assert.equal(f.project.status, 'archived');
  assert.equal(f.project.backlink_check_claimed_at, null);
});

test('a restored badge cancels the warning and a later removal gets a new grace period', async () => {
  const f = fixture();
  await reverifyBadge('project', f.deps);
  f.advance(8);
  f.deps.verify = async () => ({ outcome: { kind: 'verified' } });
  assert.equal(await reverifyBadge('project', f.deps), 'verified');
  assert.equal(f.project.backlink_warning_sent_at, null);
  f.deps.verify = async () => ({ outcome: { kind: 'image_only' } });
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
  assert.equal(f.messages.length, 2);
  assert.equal(f.project.status, 'live');
});

for (const kind of ['fetch_error', 'invalid_url']) {
  test(`${kind} neither warns nor penalizes a listing, even after the deadline`, async () => {
    const f = fixture({ backlink_warning_sent_at: '2026-09-01T04:00:00Z' });
    f.deps.verify = async () => ({ outcome: { kind } });
    assert.equal(await reverifyBadge('project', f.deps), 'inconclusive');
    assert.equal(f.project.status, 'live');
    assert.equal(f.project.link_type, 'dofollow');
    assert.equal(f.messages.length, 0);
  });
}

test('failed email does not start the grace period and can be retried', async () => {
  const f = fixture();
  f.deps.warn = async () => ({ success: false });
  await assert.rejects(reverifyBadge('project', f.deps), /email failed/);
  assert.equal(f.project.backlink_warning_sent_at, null);
  assert.equal(f.project.backlink_check_claimed_at, null);
  assert.equal(f.project.status, 'live');
  f.deps.warn = async () => ({ success: true });
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
});

test('overlapping runs send only one warning', async () => {
  const f = fixture();
  const outcomes = await Promise.all([reverifyBadge('project', f.deps), reverifyBadge('project', f.deps)]);
  assert.deepEqual(outcomes.sort(), ['skipped', 'warned']);
  assert.equal(f.messages.length, 1);
});

test('stale cron lease can be reclaimed', async () => {
  const f = fixture({ backlink_check_claimed_at: '2026-09-21T03:00:00Z' });
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
});

test('Premium and manually granted dofollow are exempt', async () => {
  for (const overrides of [{ plan: 'premium' }, { dofollow_reason: 'manual_upgrade' }]) {
    const f = fixture(overrides);
    assert.equal(await reverifyBadge('project', f.deps), 'skipped');
    assert.equal(f.messages.length, 0);
  }
});

test('Premium upgrade during the fetch prevents archiving', async () => {
  const f = fixture({ backlink_warning_sent_at: '2026-09-01T04:00:00Z' });
  f.deps.verify = async () => {
    f.project.plan = 'premium';
    f.project.dofollow_reason = 'premium_plan';
    return { outcome: { kind: 'not_found' } };
  };
  assert.equal(await reverifyBadge('project', f.deps), 'skipped');
  assert.equal(f.project.status, 'live');
  assert.equal(f.project.link_type, 'dofollow');
});

test('nofollow badge link triggers a warning', async () => {
  const f = fixture();
  f.deps.verify = async () => ({ outcome: { kind: 'nofollow_only' } });
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
});

test('warning email escapes listing names and explains the deadline and Premium alternative', () => {
  const html = badgeWarningHtml({ projectName: '<script>unsafe</script>', deadline: '2026-09-28T04:00:00Z' },
    { name: 'AI Launch Space', url: 'https://ailaunchspace.com' });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('7 days'));
  assert.ok(html.includes('Upgrade your listing to Premium'));
  assert.ok(html.includes('https://ailaunchspace.com/dashboard'));
});
