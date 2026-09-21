/** Weekly badge enforcement. Dependencies are injected so failure paths can be tested. */
export const BADGE_GRACE_DAYS = 7;
const GRACE_MS = BADGE_GRACE_DAYS * 24 * 60 * 60 * 1000;
export const badgeEligibility = {
  status: 'live',
  plan: 'standard',
  link_type: 'dofollow',
  dofollow_reason: 'verified_badge',
};

type Project = Record<string, any>;
type Dependencies = {
  db: {
    findOne: (table: string, query: Record<string, any>) => Promise<any>;
    updateOne: (table: string, query: Record<string, any>, update: any) => Promise<{ matchedCount: number }>;
  };
  verify: (url: string) => Promise<{ outcome: { kind: string } }>;
  warn: (project: Project, email: string, deadline: Date, key: string) => Promise<{ success: boolean }>;
  now?: () => Date;
};

export async function reverifyBadge(projectId: string, deps: Dependencies) {
  const now = deps.now || (() => new Date());
  const claimedAt = now().toISOString();
  const filter = { id: projectId, ...badgeEligibility };
  // A database lease prevents overlapping cron runs from emailing the same owner.
  const claim = await deps.db.updateOne('apps', {
    ...filter,
    $or: [
      { backlink_check_claimed_at: { $exists: false } },
      { backlink_check_claimed_at: { $lt: new Date(+now() - 30 * 60 * 1000).toISOString() } },
    ],
  }, { $set: { backlink_check_claimed_at: claimedAt } });
  if (!claim.matchedCount) return 'skipped';

  const owned = { ...filter, backlink_check_claimed_at: claimedAt };
  try {
    const project = await deps.db.findOne('apps', owned);
    if (!project) return 'skipped';
    const url = project.backlink_url || project.website_url;
    if (!url) return 'inconclusive';
    const { outcome } = await deps.verify(url);
    // Only a successfully fetched page with a missing/invalid link is evidence.
    if (!['verified', 'not_found', 'image_only', 'nofollow_only'].includes(outcome.kind)) {
      await deps.db.updateOne('apps', owned, { $set: { backlink_last_checked_at: now().toISOString() } });
      return 'inconclusive';
    }
    if (outcome.kind === 'verified') {
      const updated = await deps.db.updateOne('apps', owned, { $set: {
        backlink_verified: true,
        backlink_last_checked_at: now().toISOString(),
        backlink_warning_sent_at: null,
      } });
      return updated.matchedCount ? 'verified' : 'skipped';
    }

    if (!project.backlink_warning_sent_at) {
      const owner = await deps.db.findOne('users', { id: project.submitted_by });
      const email = owner?.email || project.contact_email;
      if (!email) throw new Error('No owner email available');
      // Check eligibility again after fetching: a paid upgrade cancels enforcement.
      if (!await deps.db.findOne('apps', owned)) return 'skipped';
      const sentAt = now();
      const result = await deps.warn(project, email, new Date(+sentAt + GRACE_MS),
        `badge-warning/${projectId}/${claimedAt}`);
      if (!result.success) throw new Error('Badge warning email failed');
      const updated = await deps.db.updateOne('apps', owned, { $set: {
        backlink_warning_sent_at: sentAt.toISOString(),
        backlink_last_checked_at: now().toISOString(),
      } });
      return updated.matchedCount ? 'warned' : 'skipped';
    }

    const deadline = Date.parse(project.backlink_warning_sent_at) + GRACE_MS;
    if (!Number.isFinite(deadline)) throw new Error('Invalid badge warning timestamp');
    if (+now() < deadline) return 'grace';
    // Archive rather than delete; the admin can restore the listing.
    // Guard the write against a concurrent Premium upgrade or manual link change.
    const updated = await deps.db.updateOne('apps', {
      ...owned,
      backlink_warning_sent_at: project.backlink_warning_sent_at,
    }, { $set: {
      status: 'archived',
      link_type: 'nofollow',
      dofollow_status: false,
      dofollow_reason: null,
      dofollow_awarded_at: null,
      backlink_verified: false,
      backlink_last_checked_at: now().toISOString(),
      rejection_reason: 'Badge not restored within 7 days of the warning email.',
    } });
    return updated.matchedCount ? 'archived' : 'skipped';
  } finally {
    await deps.db.updateOne('apps', { id: projectId, backlink_check_claimed_at: claimedAt }, {
      $set: { backlink_check_claimed_at: null },
    });
  }
}
