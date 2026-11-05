/**
 * Who holds which ad spot. Pure functions over `promotions` rows, so the rules
 * that decide what a customer can buy are testable without a database.
 *
 * A spot is taken by a paid ad that is still running, or by a checkout started
 * within the hold window. House ads never take a spot: they only fill what is
 * left over, and a paid ad pushes them out.
 */

export type SlotRow = {
  id: string;
  status: string;
  is_house?: boolean | null;
  created_at?: string | Date | null;
  starts_at?: string | Date | null;
  ends_at?: string | Date | null;
  position?: number | null;
  [column: string]: unknown;
};

const time = (value: string | Date | null | undefined) =>
  value ? new Date(value).getTime() : 0;

/** Showing on the site right now. No `ends_at` means open-ended. */
export function isLive(row: SlotRow, now: number): boolean {
  return row.status === 'active' && (!row.ends_at || time(row.ends_at) > now);
}

function holdsSlot(row: SlotRow, holdMs: number, now: number): boolean {
  if (row.is_house) return false;
  if (row.status === 'pending') return now - time(row.created_at) < holdMs;
  return isLive(row, now);
}

/** Oldest first, so an ad keeps its place for the whole paid period. */
function bySeniority(a: SlotRow, b: SlotRow): number {
  return (
    time(a.starts_at ?? a.created_at) - time(b.starts_at ?? b.created_at) ||
    a.id.localeCompare(b.id)
  );
}

function holders(rows: SlotRow[], column: string, holdMs: number, now: number): SlotRow[] {
  return rows
    .filter((row) => row[column] === true && holdsSlot(row, holdMs, now))
    .sort(bySeniority);
}

/** The ads to show: paid first, then house ads in the spots left over. */
export function adsForPlacement(
  rows: SlotRow[],
  column: string,
  capacity: number,
  now: number
): SlotRow[] {
  const live = rows.filter((row) => row[column] === true && isLive(row, now));
  const paid = live.filter((row) => !row.is_house).sort(bySeniority);
  const house = live
    .filter((row) => row.is_house)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || bySeniority(a, b));
  return [...paid, ...house].slice(0, capacity);
}

export function availability(
  rows: SlotRow[],
  column: string,
  capacity: number,
  holdMs: number,
  now: number
): { taken: number; max: number; available: boolean; nextOpening: string | null } {
  const taken = holders(rows, column, holdMs, now);
  const available = taken.length < capacity;
  const endings = taken.filter((row) => row.ends_at).map((row) => time(row.ends_at));
  return {
    taken: taken.length,
    max: capacity,
    available,
    nextOpening:
      available || endings.length === 0
        ? null
        : new Date(Math.min(...endings)).toISOString(),
  };
}

/**
 * Whether `id` is within capacity. Run it after inserting the pending row: of
 * two simultaneous checkouts for the last spot each then sees the other, and
 * the seniority order lets exactly one through.
 */
export function holdsWithinCapacity(
  rows: SlotRow[],
  column: string,
  capacity: number,
  holdMs: number,
  id: string,
  now: number
): boolean {
  const index = holders(rows, column, holdMs, now).findIndex((row) => row.id === id);
  return index >= 0 && index < capacity;
}
