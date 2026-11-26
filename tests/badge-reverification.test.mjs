import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reverifyBadge, badgeEligibility } from '../lib/badge-reverification.ts';
import { badgeRevokedHtml, badgeWarningHtml } from '../lib/badge-warning-email.ts';

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
    backlink_warning_sent_at: null, backlink_missing_since: null, badge_revoked_at: null,
    backlink_check_claimed_at: null, ...overrides };
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
    notify: async (...args) => { messages.push(args); return { success: true }; },
  };
  return { project, deps, messages, advance: days => { now = new Date(+now + days * 86400000); } };
}

test('warns once, keeps dofollow for seven days, then revokes dofollow but keeps the listing live', async () => {
  const f = fixture();
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
  assert.equal(f.messages[0][0], 'badgeRemoved');
  assert.equal(f.messages[0][2], 'owner@example.com');
  assert.equal(f.messages[0][3].deadline.toISOString(), '2026-09-28T04:00:00.000Z');
  assert.equal(f.project.backlink_missing_since, '2026-09-21T04:00:00.000Z');
  assert.equal(f.project.link_type, 'dofollow');
  assert.equal(await reverifyBadge('project', f.deps), 'grace');
  f.advance(6);
  assert.equal(await reverifyBadge('project', f.deps), 'grace');
  f.advance(1);
  assert.equal(await reverifyBadge('project', f.deps), 'revoked');
  assert.equal(f.project.status, 'live');
  assert.equal(f.project.link_type, 'nofollow');
  assert.equal(f.project.dofollow_reason, null);
  assert.ok(f.project.badge_revoked_at);
  assert.deepEqual(f.messages.map(m => m[0]), ['badgeRemoved', 'badgeRevoked']);
  assert.equal(f.project.backlink_check_claimed_at, null);
});

test('email failure does not stop the grace period from running out', async () => {
  const f = fixture();
  f.deps.notify = async () => ({ success: false });
  assert.equal(await reverifyBadge('project', f.deps), 'grace');
  assert.equal(f.project.backlink_warning_sent_at, null);
  assert.ok(f.project.backlink_missing_since);
  f.advance(7);
  assert.equal(await reverifyBadge('project', f.deps), 'revoked');
  assert.equal(f.project.link_type, 'nofollow');
});

test('a thrown email error is not fatal either', async () => {
  const f = fixture();
  f.deps.notify = async () => { throw new Error('domain is not verified'); };
  assert.equal(await reverifyBadge('project', f.deps), 'grace');
  assert.equal(f.project.backlink_check_claimed_at, null);
});

test('a failed warning is retried on the next run while the clock keeps its start', async () => {
  const f = fixture();
  f.deps.notify = async () => ({ success: false });
  await reverifyBadge('project', f.deps);
  f.advance(1);
  f.deps.notify = async (...args) => { f.messages.push(args); return { success: true }; };
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
  assert.equal(f.messages[0][3].deadline.toISOString(), '2026-09-28T04:00:00.000Z');
});

test('a restored badge cancels the grace period and a later removal starts a new one', async () => {
  const f = fixture();
  await reverifyBadge('project', f.deps);
  f.advance(3);
  f.deps.verify = async () => ({ outcome: { kind: 'verified' } });
  assert.equal(await reverifyBadge('project', f.deps), 'verified');
  assert.equal(f.project.backlink_missing_since, null);
  assert.equal(f.project.backlink_warning_sent_at, null);
  f.deps.verify = async () => ({ outcome: { kind: 'image_only' } });
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
  assert.equal(f.project.backlink_missing_since, '2026-09-24T04:00:00.000Z');
});

test('a revoked listing gets dofollow back when the badge returns', async () => {
  const f = fixture({ link_type: 'nofollow', dofollow_reason: null, badge_revoked_at: '2026-09-01T04:00:00.000Z' });
  assert.equal(await reverifyBadge('project', f.deps), 'still_revoked');
  assert.equal(f.project.link_type, 'nofollow');
  f.deps.verify = async () => ({ outcome: { kind: 'verified' } });
  assert.equal(await reverifyBadge('project', f.deps), 'restored');
  assert.equal(f.project.link_type, 'dofollow');
  assert.equal(f.project.dofollow_reason, 'verified_badge');
  assert.equal(f.project.dofollow_status, true);
  assert.equal(f.project.badge_revoked_at, null);
});

for (const kind of ['fetch_error', 'invalid_url']) {
  test(`${kind} neither warns nor penalizes a listing, even after the deadline`, async () => {
    const f = fixture({ backlink_missing_since: '2026-09-01T04:00:00Z' });
    f.deps.verify = async () => ({ outcome: { kind } });
    assert.equal(await reverifyBadge('project', f.deps), 'inconclusive');
    assert.equal(f.project.link_type, 'dofollow');
    assert.equal(f.messages.length, 0);
  });
}

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

test('Premium, manual grants and never-verified free listings are left alone', async () => {
  for (const overrides of [
    { plan: 'premium', dofollow_reason: 'premium_plan' },
    { dofollow_reason: 'manual_upgrade' },
    { link_type: 'nofollow', dofollow_reason: null },
  ]) {
    const f = fixture(overrides);
    assert.equal(await reverifyBadge('project', f.deps), 'skipped');
    assert.equal(f.messages.length, 0);
  }
});

test('Premium upgrade during the fetch prevents revoking', async () => {
  const f = fixture({ backlink_missing_since: '2026-09-01T04:00:00Z' });
  f.deps.verify = async () => {
    f.project.plan = 'premium';
    f.project.dofollow_reason = 'premium_plan';
    return { outcome: { kind: 'not_found' } };
  };
  assert.equal(await reverifyBadge('project', f.deps), 'skipped');
  assert.equal(f.project.link_type, 'dofollow');
});

test('nofollow badge link triggers a warning', async () => {
  const f = fixture();
  f.deps.verify = async () => ({ outcome: { kind: 'nofollow_only' } });
  assert.equal(await reverifyBadge('project', f.deps), 'warned');
});

test('emails escape listing names and offer the Premium alternative', () => {
  const site = { name: 'AI Launch Space', url: 'https://ailaunchspace.com' };
  for (const html of [
    badgeWarningHtml({ projectName: '<script>unsafe</script>', deadline: '2026-09-28T04:00:00Z' }, site),
    badgeRevokedHtml({ projectName: '<script>unsafe</script>' }, site),
  ]) {
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('Upgrade your listing to Premium'));
    assert.ok(html.includes('https://ailaunchspace.com/dashboard'));
  }
});
