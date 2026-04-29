"use client";

import { useEffect, useRef } from "react";
import { analyticsConfig } from "@/config/analytics.config";
import { isEnabled } from "@/lib/features";

/**
 * Lightweight site analytics tracker.
 * - Checks the `analytics` feature flag before doing anything.
 * - Fires a pageview beacon once per session (uses sessionStorage to dedupe).
 * - Sends navigator.userAgent, document.referrer, and page path.
 * - Tracks time-on-page via the visibilitychange event.
 * - Optionally initialises PostHog when configured.
 */
export function SiteTracker() {
  const pageEnteredAt = useRef<number>(Date.now());

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
