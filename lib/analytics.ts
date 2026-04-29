/**
 * Client-side event tracking utility.
 *
 * Respects the `analytics` feature flag — when disabled, calls are no-ops.
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics';
 *   trackEvent('cta_clicked', { project_id: '...', position: 'hero' });
 */
import { isEnabled } from '@/lib/features';

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window === "undefined") return;
  if (!isEnabled('analytics')) return;

  try {
    navigator.sendBeacon(
      "/api/analytics/track",
      JSON.stringify({
        event_type: "event",
        event_name: event,
        page_path: window.location.pathname,
        ...properties,
      }),
    );
  } catch {
    // Silently ignore tracking errors — analytics should never break the app
  }
}
