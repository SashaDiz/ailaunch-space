/**
 * Pure aggregation for the public /stats page. No imports, so it is tested
 * directly (tests/site-stats.test.mjs). Days are UTC `YYYY-MM-DD`, like the
 * pageview tracker that writes the `analytics` rows.
 */

export type DailyAnalyticsRow = {
  date: string;
  views: number | null;
  unique_visitors: number | null;
  countries: Record<string, number> | null;
  devices: Record<string, number> | null;
};

export type DayPoint = { date: string; visits: number; visitors: number; partial?: boolean };
export type CountPoint = { date: string; count: number; total?: number; partial?: boolean };

const DAY_MS = 24 * 60 * 60 * 1000;

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The last `days` UTC days ending today, oldest first. */
export function lastDays(days: number, now: Date): string[] {
  const today = Date.parse(dayKey(now));
  return Array.from({ length: days }, (_, i) => dayKey(new Date(today - (days - 1 - i) * DAY_MS)));
}

const add = (into: Record<string, number>, from: Record<string, number> | null | undefined) => {
  for (const [key, value] of Object.entries(from || {})) {
    if (typeof value === 'number' && Number.isFinite(value)) into[key] = (into[key] || 0) + value;
  }
};

/**
 * One entry per day. The tracker has raced into duplicate rows for a day
 * before, so rows of the same day are added together.
 */
export function mergeDays(rows: DailyAnalyticsRow[]) {
  const byDay = new Map<string, { visits: number; visitors: number; countries: Record<string, number>; devices: Record<string, number> }>();
  for (const row of rows) {
    const day = byDay.get(row.date) || { visits: 0, visitors: 0, countries: {}, devices: {} };
    day.visits += row.views || 0;
    day.visitors += row.unique_visitors || 0;
    add(day.countries, row.countries);
    add(day.devices, row.devices);
    byDay.set(row.date, day);
  }
  return byDay;
}

/** Visits per day for the window, zero-filled; today is marked partial. */
export function visitsSeries(merged: ReturnType<typeof mergeDays>, days: string[], today: string): DayPoint[] {
  return days.map((date) => ({
    date,
    visits: merged.get(date)?.visits || 0,
    visitors: merged.get(date)?.visitors || 0,
    ...(date === today ? { partial: true } : {}),
  }));
}

/** Visits per calendar month, oldest first. */
export function monthlyVisits(merged: ReturnType<typeof mergeDays>): Array<{ month: string; visits: number }> {
  const months = new Map<string, number>();
  for (const [date, day] of merged) months.set(date.slice(0, 7), (months.get(date.slice(0, 7)) || 0) + day.visits);
  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, visits]) => ({ month, visits }));
}

/** Share of the window's visits per key (countries, devices), largest first. */
export function shares(merged: ReturnType<typeof mergeDays>, days: string[], field: 'countries' | 'devices') {
  const totals: Record<string, number> = {};
  for (const date of days) add(totals, merged.get(date)?.[field]);
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals)
    .filter(([key]) => key && key !== 'unknown' && key !== 'XX')
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => ({ key, count, share: sum ? count / sum : 0 }));
}

/** Items per day for the window, plus the running total if `before` is given. */
export function perDay(timestamps: Array<string | null | undefined>, days: string[], today: string, before?: number): CountPoint[] {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    if (!ts) continue;
    const key = String(ts).slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let running = before;
  return days.map((date) => {
    const count = counts.get(date) || 0;
    if (running !== undefined) running += count;
    return { date, count, ...(running !== undefined ? { total: running } : {}), ...(date === today ? { partial: true } : {}) };
  });
}

export function median(values: number[]): number {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** 1234 → "1.2K", 2_500_000 → "2.5M"; below 10K the exact number. */
export function compact(value: number): string {
  if (value < 10_000) return new Intl.NumberFormat('en-US').format(value);
  const units: Array<[number, string]> = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  const [size, unit] = units.find(([s]) => value >= s) as [number, string];
  return `${(value / size).toFixed(value / size >= 100 ? 0 : 1).replace(/\.0$/, '')}${unit}`;
}
