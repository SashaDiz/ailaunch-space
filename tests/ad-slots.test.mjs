import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adsForPlacement,
  availability,
  holdsWithinCapacity,
  isLive,
} from '../lib/ad-slots.ts';
import { adEndingHtml } from '../lib/ad-ending-email.ts';

const NOW = Date.parse('2026-11-04T12:00:00Z');
const HOUR = 3_600_000;
const HOLD = HOUR / 2;
const COLUMN = 'placement_catalog';

const at = (offset) => new Date(NOW + offset).toISOString();
const paid = (id, overrides = {}) => ({
  id,
  status: 'active',
  [COLUMN]: true,
  created_at: at(-10 * HOUR),
  starts_at: at(-10 * HOUR),
  ends_at: at(24 * HOUR),
  ...overrides,
});
const house = (id, overrides = {}) => ({
  id,
  status: 'active',
  is_house: true,
  [COLUMN]: true,
  created_at: at(-100 * HOUR),
  ...overrides,
});

test('a paid ad stops being live the moment its period ends', () => {
  assert.equal(isLive(paid('a'), NOW), true);
  assert.equal(isLive(paid('a', { ends_at: at(-1) }), NOW), false);
  assert.equal(isLive(paid('a', { ends_at: at(0) }), NOW), false);
});

test('an active row with no end date stays live', () => {
  assert.equal(isLive(paid('a', { ends_at: null }), NOW), true);
});

test('house ads never make a placement sold out', () => {
  const result = availability([house('a'), house('b'), house('c')], COLUMN, 2, HOLD, NOW);
  assert.deepEqual(result, { taken: 0, max: 2, available: true, nextOpening: null });
});

test('paid ads push house ads out of the visible spots', () => {
  const rows = [house('h1'), house('h2'), paid('p1')];
  assert.deepEqual(
    adsForPlacement(rows, COLUMN, 2, NOW).map((row) => row.id),
    ['p1', 'h1']
  );
});

test('an ad keeps its place: older paid ads stay first', () => {
  const rows = [
    paid('newer', { starts_at: at(-HOUR) }),
    paid('older', { starts_at: at(-5 * HOUR) }),
  ];
  assert.deepEqual(
    adsForPlacement(rows, COLUMN, 2, NOW).map((row) => row.id),
    ['older', 'newer']
  );
});

test('expired ads leave the site and free their spot', () => {
  const rows = [paid('gone', { ends_at: at(-HOUR) })];
  assert.deepEqual(adsForPlacement(rows, COLUMN, 1, NOW), []);
  assert.equal(availability(rows, COLUMN, 1, HOLD, NOW).available, true);
});

test('a sold-out placement reports when the first spot opens', () => {
  const rows = [paid('a', { ends_at: at(48 * HOUR) }), paid('b', { ends_at: at(24 * HOUR) })];
  const result = availability(rows, COLUMN, 2, HOLD, NOW);
  assert.equal(result.available, false);
  assert.equal(result.nextOpening, at(24 * HOUR));
});

test('an open-ended subscription still takes a spot but has no opening date', () => {
  const result = availability([paid('legacy', { ends_at: null })], COLUMN, 1, HOLD, NOW);
  assert.equal(result.available, false);
  assert.equal(result.nextOpening, null);
});

test('a fresh checkout holds its spot, an abandoned one does not', () => {
  const fresh = paid('fresh', { status: 'pending', created_at: at(-60_000), starts_at: null, ends_at: null });
  const stale = paid('stale', { status: 'pending', created_at: at(-HOUR), starts_at: null, ends_at: null });
  assert.equal(availability([fresh], COLUMN, 1, HOLD, NOW).available, false);
  assert.equal(availability([stale], COLUMN, 1, HOLD, NOW).available, true);
});

test('a pending checkout is never shown on the site', () => {
  const rows = [paid('p', { status: 'pending', ends_at: null })];
  assert.deepEqual(adsForPlacement(rows, COLUMN, 1, NOW), []);
});

test('other placements are ignored', () => {
  const rows = [paid('banner', { [COLUMN]: false, placement_banner: true })];
  assert.equal(availability(rows, COLUMN, 1, HOLD, NOW).taken, 0);
});

test('two checkouts for the last spot: only the first one wins', () => {
  const pending = (id, offset) =>
    paid(id, { status: 'pending', created_at: at(offset), starts_at: null, ends_at: null });
  const rows = [paid('sold'), pending('first', -2000), pending('second', -1000)];
  assert.equal(holdsWithinCapacity(rows, COLUMN, 2, HOLD, 'first', NOW), true);
  assert.equal(holdsWithinCapacity(rows, COLUMN, 2, HOLD, 'second', NOW), false);
});

test('a checkout created in the same instant is still decided one way', () => {
  const pending = (id) =>
    paid(id, { status: 'pending', created_at: at(-1000), starts_at: null, ends_at: null });
  const rows = [pending('b'), pending('a')];
  assert.equal(holdsWithinCapacity(rows, COLUMN, 1, HOLD, 'a', NOW), true);
  assert.equal(holdsWithinCapacity(rows, COLUMN, 1, HOLD, 'b', NOW), false);
});

test('the ending email escapes the advertiser name and counts clicks', () => {
  const site = { name: 'Site', url: 'https://example.com' };
  const html = adEndingHtml({ projectName: '<b>x</b>', endsAt: at(0), clicks: 1 }, site);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(html, /1 click</);
  assert.match(html, /https:\/\/example\.com\/promote/);
});
