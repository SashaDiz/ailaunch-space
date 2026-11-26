/**
 * Daily badge enforcement for free (Standard) listings. Dependencies are
 * injected so the failure paths can be tested without a database.
 *
 * Badge found        → listing keeps (or gets back) its dofollow link.
 * Badge missing      → `backlink_missing_since` starts a 7-day grace period;
 *                      a warning email is attempted, but delivery is NOT
 *                      required for the clock to run (a broken mail provider
 *                      used to freeze enforcement for everyone).
 * Still missing at the deadline → dofollow revoked, listing stays live.
 * Badge back on a revoked listing → dofollow restored automatically.
 * Fetch errors are inconclusive and never move the clock.
 */
export const BADGE_GRACE_DAYS = 7;
const GRACE_MS = BADGE_GRACE_DAYS * 24 * 60 * 60 * 1000;
const LEASE_MS = 30 * 60 * 1000;

/** Live Standard listings whose dofollow depends on the badge. */
export const badgeEligibility = {
  status: 'live',
  plan: 'standard',
  link_type: 'dofollow',
  dofollow_reason: 'verified_badge',
};

/** Live Standard listings that lost dofollow for a missing badge and can earn it back. */
export const badgeRevokedEligibility = {
  status: 'live',
  plan: 'standard',
  link_type: 'nofollow',
  badge_revoked_at: { $exists: true },
};

export type BadgeCheckOutcome =
  | 'verified' | 'warned' | 'grace' | 'revoked' | 'restored' | 'still_revoked'
  | 'inconclusive' | 'skipped';

export type BadgeEmailKind = 'badgeRemoved' | 'badgeRevoked';

type Project = Record<string, any>;
type Dependencies = {
  db: {
    findOne: (table: string, query: Record<string, any>) => Promise<any>;
    updateOne: (table: string, query: Record<string, any>, update: any) => Promise<{ matchedCount: number }>;
  };
  verify: (url: string) => Promise<{ outcome: { kind: string } }>;
  /** Best effort: a failed send is logged and retried on the next run, never fatal. */
  notify: (kind: BadgeEmailKind, project: Project, email: string, data: { deadline?: Date },
    idempotencyKey: string) => Promise<{ success: boolean }>;
  now?: () => Date;
};

const EVIDENCE = ['verified', 'not_found', 'image_only', 'nofollow_only'];

export async function reverifyBadge(projectId: string, deps: Dependencies): Promise<BadgeCheckOutcome> {
  const now = deps.now || (() => new Date());
  const claimedAt = now().toISOString();
  const base = { id: projectId, status: 'live', plan: 'standard' };

  // A database lease prevents overlapping runs from emailing the same owner twice.
  const claim = await deps.db.updateOne('apps', {
    ...base,
    $or: [
      { backlink_check_claimed_at: { $exists: false } },
      { backlink_check_claimed_at: { $lt: new Date(+now() - LEASE_MS).toISOString() } },
    ],
  }, { $set: { backlink_check_claimed_at: claimedAt } });
  if (!claim.matchedCount) return 'skipped';

  try {
    const project = await deps.db.findOne('apps', { ...base, backlink_check_claimed_at: claimedAt });
    if (!project) return 'skipped';

    const isActive = project.link_type === 'dofollow' && project.dofollow_reason === 'verified_badge';
    const isRevoked = project.link_type === 'nofollow' && !!project.badge_revoked_at;
    if (!isActive && !isRevoked) return 'skipped';

    // Every write re-checks the state it was decided on, so a concurrent
    // Premium upgrade or a manual admin change always wins.
    const owned = {
      ...base,
      backlink_check_claimed_at: claimedAt,
      ...(isActive
        ? { link_type: 'dofollow', dofollow_reason: 'verified_badge' }
        : { link_type: 'nofollow', badge_revoked_at: project.badge_revoked_at }),
    };
    const set = async (fields: Record<string, any>) =>
      (await deps.db.updateOne('apps', owned, { $set: fields })).matchedCount > 0;
    const checkedAt = now().toISOString();

    const url = project.backlink_url || project.website_url;
    const outcome = url ? (await deps.verify(url)).outcome.kind : 'invalid_url';
    if (!EVIDENCE.includes(outcome)) {
      await set({ backlink_last_checked_at: checkedAt });
      return 'inconclusive';
    }

    if (outcome === 'verified') {
      const cleared = {
        backlink_verified: true,
        backlink_last_checked_at: checkedAt,
        backlink_missing_since: null,
        backlink_warning_sent_at: null,
      };
      if (isActive) return await set(cleared) ? 'verified' : 'skipped';
      const restored = await set({
        ...cleared,
        link_type: 'dofollow',
        dofollow_status: true,
        dofollow_reason: 'verified_badge',
        dofollow_awarded_at: checkedAt,
        badge_revoked_at: null,
      });
      return restored ? 'restored' : 'skipped';
    }

    // Badge missing, image without a link, or rel="nofollow".
    if (isRevoked) {
      await set({ backlink_last_checked_at: checkedAt });
      return 'still_revoked';
    }

    const missingSince = project.backlink_missing_since || project.backlink_warning_sent_at || checkedAt;
    const deadline = new Date(Date.parse(missingSince) + GRACE_MS);
    if (!Number.isFinite(+deadline)) throw new Error('Invalid badge missing timestamp');

    if (+now() < +deadline) {
      if (!await set({ backlink_missing_since: missingSince, backlink_last_checked_at: checkedAt })) {
        return 'skipped';
      }
      if (project.backlink_warning_sent_at) return 'grace';
      const sent = await sendBestEffort(deps, 'badgeRemoved', project, { deadline },
        `badge-warning/${projectId}/${missingSince}`);
      if (sent) await set({ backlink_warning_sent_at: now().toISOString() });
      return sent ? 'warned' : 'grace';
    }

    // Revoke the dofollow link but keep the listing live: the owner can
    // still earn it back by restoring the badge, or upgrade to Premium.
    const revoked = await set({
      link_type: 'nofollow',
      dofollow_status: false,
      dofollow_reason: null,
      dofollow_awarded_at: null,
      backlink_verified: false,
      backlink_last_checked_at: checkedAt,
      backlink_missing_since: null,
      backlink_warning_sent_at: null,
      badge_revoked_at: checkedAt,
    });
    if (!revoked) return 'skipped';
    await sendBestEffort(deps, 'badgeRevoked', project, {}, `badge-revoked/${projectId}/${checkedAt}`);
    return 'revoked';
  } finally {
    await deps.db.updateOne('apps', { id: projectId, backlink_check_claimed_at: claimedAt }, {
      $set: { backlink_check_claimed_at: null },
    });
  }
}

async function sendBestEffort(deps: Dependencies, kind: BadgeEmailKind, project: Project,
  data: { deadline?: Date }, key: string): Promise<boolean> {
  try {
    const owner = project.submitted_by
      ? await deps.db.findOne('users', { id: project.submitted_by })
      : null;
    const email = owner?.email || project.contact_email;
    if (!email) return false;
    const result = await deps.notify(kind, project, email, data, key);
    if (!result?.success) console.error(`Badge ${kind} email not delivered:`, project.id);
    return !!result?.success;
  } catch (error) {
    console.error(`Badge ${kind} email failed:`, project.id, error);
    return false;
  }
}
