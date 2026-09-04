/**
 * Notification types a user cannot switch off.
 *
 * Account and submission lifecycle, plus the launch-week reminder: somebody in
 * an active competition has to be told.
 *
 * One list, because there were three — twice in lib/notifications.ts and once
 * in the settings page — and the settings page's save path had already lost
 * `launch_week_reminder`, so saving preferences silently un-forced it.
 *
 * This module deliberately has no imports: it is pulled into both the server
 * notification manager and the client settings page, and lib/notifications.ts
 * cannot be imported from the browser (it reaches for the service-role client
 * and the email transport).
 *
 * Enforced server-side in app/api/user/notification-preferences. The settings
 * page greys these out, but a checkbox is a suggestion, not a control.
 */
export const MANDATORY_NOTIFICATIONS = [
  'account_creation',
  'account_deletion',
  'submission_received',
  'submission_approval',
  'submission_decline',
  'launch_week_reminder',
] as const;

export type MandatoryNotification = (typeof MANDATORY_NOTIFICATIONS)[number];
