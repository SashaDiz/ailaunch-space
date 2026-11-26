/**
 * Paid Premium listings skip admin review: the moment the payment is
 * confirmed they go live, with the same publish fields admin approval sets.
 *
 * Only listings still waiting (draft / pending) are published. A listing an
 * admin rejected or archived stays where it is, so paying cannot undo a
 * moderation decision.
 */
const HOMEPAGE_DAYS = 7;
const PUBLISHABLE = new Set(['draft', 'pending']);

export function paidListingGoLiveFields(currentStatus: string | null | undefined, now = new Date()) {
  if (currentStatus === 'live') return { status: 'live' };
  if (!PUBLISHABLE.has(currentStatus || 'pending')) return {};
  return {
    status: 'live',
    approved: true,
    is_draft: false,
    published_at: now,
    launched_at: now,
    homepage_start_date: now,
    homepage_end_date: new Date(+now + HOMEPAGE_DAYS * 24 * 60 * 60 * 1000),
  };
}
