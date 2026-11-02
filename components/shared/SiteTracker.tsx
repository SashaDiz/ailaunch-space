"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analyticsConfig } from "@/config/analytics.config";
import { isEnabled } from "@/lib/features";

/**
 * Lightweight site analytics tracker.
 * - Checks the `analytics` feature flag before doing anything.
 * - Fires a pageview beacon once per session (uses sessionStorage to dedupe).
 * - Sends navigator.userAgent, document.referrer, and page path.
 * - Tracks time-on-page via the visibilitychange event.
 * - Optionally initialises PostHog when configured.
 * - Sends a presence heartbeat (random per-tab id + current path) every 30s
 *   while the tab is visible and on every route change, for the catalog's
 *   "who's on the site right now" block.
 */

/** Heartbeat period; a session counts as live for five minutes after one. */
const PRESENCE_INTERVAL_MS = 30_000;
const PRESENCE_KEY = "site-presence-id";

/** One random id per tab (sessionStorage), never tied to the user or IP. */
function presenceId(): string | null {
  try {
    let id = sessionStorage.getItem(PRESENCE_KEY);
    if (!id && typeof crypto !== "undefined" && "randomUUID" in crypto) {
      id = crypto.randomUUID();
      sessionStorage.setItem(PRESENCE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function usePresenceHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isEnabled("analytics")) return;
    // A local dev server talks to the production database; its tabs must
    // not show up as live visitors (they'd count, with no country).
    if (process.env.NODE_ENV !== "production") return;
    const id = presenceId();
    if (!id) return;

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/analytics/presence", {
        method: "POST",
        keepalive: true,
        body: JSON.stringify({ session_id: id, page_path: window.location.pathname }),
      }).catch(() => {});
    };

    beat();
    const timer = setInterval(beat, PRESENCE_INTERVAL_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [pathname]);
}
export function SiteTracker() {
  const pageEnteredAt = useRef<number>(Date.now());
  usePresenceHeartbeat();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Bail out entirely when the analytics feature is disabled
    if (!isEnabled("analytics")) return;

    // --- Pageview beacon (once per session) ---
    const key = "site-tracked";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");

      try {
        const payload = JSON.stringify({
          event_type: "pageview",
          page_path: window.location.pathname,
          referrer: document.referrer || undefined,
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/analytics/track", payload);
        } else {
          fetch("/api/analytics/track", {
            method: "POST",
            keepalive: true,
            body: payload,
          }).catch(() => {});
        }
      } catch {
        // Silently ignore — analytics should never break the app
      }
    }

    // --- Time-on-page tracking ---
    pageEnteredAt.current = Date.now();

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        const duration = Math.round(
          (Date.now() - pageEnteredAt.current) / 1000,
        );
        if (duration > 0) {
          try {
            const topPayload = JSON.stringify({
              event_type: "time_on_page",
              page_path: window.location.pathname,
              duration,
            });
            if (navigator.sendBeacon) {
              navigator.sendBeacon("/api/analytics/track", topPayload);
            } else {
              fetch("/api/analytics/track", {
                method: "POST",
                keepalive: true,
                body: topPayload,
              }).catch(() => {});
            }
          } catch {
            // Silently ignore
          }
        }
      } else {
        // Page became visible again — reset timer
        pageEnteredAt.current = Date.now();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // --- PostHog initialisation (dynamic import, only when configured) ---
    if (analyticsConfig.posthog?.apiKey) {
      import("posthog-js")
        .then(({ default: posthog }) => {
          if (!posthog.__loaded) {
            posthog.init(analyticsConfig.posthog!.apiKey, {
              api_host: analyticsConfig.posthog!.host,
              loaded: (ph) => {
                if (process.env.NODE_ENV === "development") {
                  ph.opt_out_capturing();
                }
              },
            });
          }
        })
        .catch(() => {
          // PostHog not installed or failed to load — silently ignore
        });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
