import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

// Do not start the production cleanup interval in this isolated test process.
const interval = mock.method(globalThis, 'setInterval', () => 0);
const { checkRateLimit, createRateLimitResponse } = await import('../lib/rate-limit.ts');
interval.mock.restore();

test('badge checks allow five per minute and thirty per hour, independently of submissions', async (t) => {
  let now = 3_600_000;
  t.mock.method(Date, 'now', () => now);
  const request = new Request('https://example.com/api/verify-badge', {
    headers: { 'x-vercel-forwarded-for': '203.0.113.15' },
  });
  const checkBadge = async () => {
    for (const bucket of ['badgeMinute', 'badgeHour']) {
      const result = await checkRateLimit(request, bucket);
      if (!result.allowed) return result;
    }
    return { allowed: true };
  };

  // Exhausting project submissions must not consume the badge allowance.
  for (let i = 0; i < 3; i++) {
    assert.equal((await checkRateLimit(request, 'submission')).allowed, true);
  }
  assert.equal((await checkRateLimit(request, 'submission')).allowed, false);

  for (let minute = 0; minute < 6; minute++) {
    now = 3_600_000 + minute * 60_000;
    for (let i = 0; i < 5; i++) {
      assert.equal((await checkBadge()).allowed, true);
    }
    const blocked = await checkBadge();
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.limitType, 'badgeMinute');
    assert.equal(blocked.retryAfter, 60);
  }

  now += 60_000;
  const blocked = await checkBadge();
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.limitType, 'badgeHour');
  assert.equal(blocked.retryAfter, 54 * 60);
  const response = createRateLimitResponse(blocked);
  assert.equal(response.status, 429);
  assert.equal(JSON.parse(response.body).code, 'RATE_LIMIT_EXCEEDED');
  assert.equal(response.headers['Retry-After'], '3240');

  const otherIp = new Request(request.url, {
    headers: { 'x-vercel-forwarded-for': '203.0.113.16' },
  });
  assert.equal((await checkRateLimit(otherIp, 'badgeHour')).allowed, true);

  now = 7_200_000;
  assert.equal((await checkBadge()).allowed, true);
});
