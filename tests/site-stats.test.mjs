import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compact, lastDays, median, mergeDays, monthlyVisits, perDay, shares, visitsSeries } from '../lib/site-stats-math.ts';

const now = new Date('2026-11-27T10:00:00Z');

test('lastDays ends today, oldest first', () => {
  assert.deepEqual(lastDays(3, now), ['2026-11-25', '2026-11-26', '2026-11-27']);
});

test('duplicate rows of one day are added, missing days are zero, today is partial', () => {
  const merged = mergeDays([
    { date: '2026-11-26', views: 10, unique_visitors: 6, countries: { US: 8, DE: 2 }, devices: { desktop: 10 } },
    { date: '2026-11-26', views: 5, unique_visitors: 3, countries: { US: 5 }, devices: { mobile: 5 } },
    { date: '2026-11-27', views: 2, unique_visitors: 2, countries: null, devices: null },
  ]);
  const series = visitsSeries(merged, lastDays(3, now), '2026-11-27');
  assert.deepEqual(series.map((d) => d.visits), [0, 15, 2]);
  assert.equal(series[2].partial, true);
  const countries = shares(merged, lastDays(3, now), 'countries');
  assert.equal(countries[0].key, 'US');
  assert.equal(countries[0].count, 13);
  assert.ok(Math.abs(countries[0].share - 13 / 15) < 1e-9);
});

test('monthly visits group by calendar month', () => {
  const merged = mergeDays([
    { date: '2026-10-31', views: 4, unique_visitors: 1, countries: null, devices: null },
    { date: '2026-11-01', views: 6, unique_visitors: 1, countries: null, devices: null },
    { date: '2026-11-02', views: 1, unique_visitors: 1, countries: null, devices: null },
  ]);
  assert.deepEqual(monthlyVisits(merged), [{ month: '2026-10', visits: 4 }, { month: '2026-11', visits: 7 }]);
});

test('perDay counts timestamps per day and keeps a running total', () => {
  const days = lastDays(3, now);
  const points = perDay(['2026-11-25T08:00:00Z', '2026-11-27T01:00:00Z', '2026-11-27T02:00:00Z', null, '2026-01-01T00:00:00Z'], days, '2026-11-27', 100);
  assert.deepEqual(points.map((p) => p.count), [1, 0, 2]);
  assert.deepEqual(points.map((p) => p.total), [101, 101, 103]);
});

test('median and compact numbers', () => {
  assert.equal(median([5, 1, 9]), 5);
  assert.equal(median([1, 2, 3, 4]), 3);
  assert.equal(median([]), 0);
  assert.equal(compact(9_999), '9,999');
  assert.equal(compact(10_149), '10.1K');
  assert.equal(compact(2_500_000), '2.5M');
  assert.equal(compact(150_000), '150K');
});
