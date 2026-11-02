"use client";

import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { useTheme } from "next-themes";

/**
 * "Who's on the site right now" — a rotating dotted globe with a dot per
 * active visitor, the live count, a short feed of what people are reading,
 * and the 7-day top countries. Rendered as a full-width row in the middle
 * of the catalog grid.
 *
 * Data comes from /api/live-stats, built on our own tracking (SiteTracker's
 * presence heartbeat + the daily site analytics rows). Country-level only.
 * Renders nothing until the first answer arrives.
 */

/** Refresh while the tab is visible. The API caches for 10–15s. */
const POLL_MS = 30_000;

interface LiveStatsData {
  configured: boolean;
  now?: number;
  countries?: number;
  points?: [number, number][];
  feed?: { countryCode: string; path: string; since: string | null }[];
  /** Browser sessions over the last `visitsDays` days. */
  visits?: number;
  visitsDays?: number;
  topCountries?: { countryCode: string; visitors: number }[];
  moreCountries?: number;
}

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function countryName(code: string): string {
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Regional-indicator pair, e.g. "BR" → 🇧🇷. */
function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function timeAgo(iso: string | null): string | null {
  if (!iso) return null;
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (!Number.isFinite(seconds)) return null;
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

const numberFormat = new Intl.NumberFormat("en-US");

function toMarkers(points: [number, number][]) {
  return points.map(([lat, lng]) => ({ location: [lat, lng] as [number, number], size: 0.05 }));
}

function Globe({ points }: { points: [number, number][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = canvas.offsetWidth;
    let phi = 0;
    let frame = 0;

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: 0,
      theta: 0.25,
      dark: dark ? 1 : 0,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: dark ? 4 : 6,
      baseColor: dark ? [0.25, 0.25, 0.3] : [1, 1, 1],
      markerColor: [0.98, 0.7, 0.15],
      glowColor: dark ? [0.15, 0.15, 0.2] : [0.94, 0.94, 0.96],
      markers: toMarkers(pointsRef.current),
    });
    globeRef.current = globe;

    const resize = new ResizeObserver(() => {
      size = canvas.offsetWidth;
      globe.update({ width: size * dpr, height: size * dpr });
    });
    resize.observe(canvas);

    const tick = () => {
      phi += 0.003;
      globe.update({ phi });
      frame = requestAnimationFrame(tick);
    };
    if (!reduceMotion) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      globe.destroy();
      globeRef.current = null;
    };
  }, [dark]);

  // A poll only moves the dots — no need to rebuild the WebGL context.
  useEffect(() => {
    globeRef.current?.update({ markers: toMarkers(points) });
  }, [points]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="aspect-square w-full max-w-[22rem]"
    />
  );
}

export function LiveStats() {
  const [data, setData] = useState<LiveStatsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/live-stats");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // A missed poll just keeps the last numbers on screen.
      }
    };
    // Poll only while visible; catch up as soon as the tab comes back.
    const poll = () => {
      if (document.visibilityState === "visible") load();
    };
    load();
    const timer = setInterval(poll, POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, []);

  if (!data?.configured) return null;

  const feed = data.feed ?? [];
  // "from 0 countries" only happens when no live session has a geo header
  // (e.g. the platform didn't send one) — say nothing rather than that.
  const summary = [
    data.countries ? `from ${data.countries} ${data.countries === 1 ? "country" : "countries"}` : null,
    data.visits != null
      ? `${numberFormat.format(data.visits)} visits in the last ${data.visitsDays ?? 30} days`
      : null,
  ].filter(Boolean);
  const topCountries = data.topCountries ?? [];

  return (
    <section
      aria-label="Who's on the site right now"
      className="col-span-full my-4 border-y border-border py-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <p className="flex items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Live · who&apos;s on the site right now
        </p>
        <p className="normal-case tracking-normal">country-level only, nobody is identifiable</p>
      </div>

      <div className="mt-6 grid items-center gap-8 md:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="flex justify-center">
          <Globe points={data.points ?? []} />
        </div>

        <div className="min-w-0">
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-5xl font-bold tabular-nums text-foreground sm:text-6xl">
              {numberFormat.format(data.now ?? 0)}
            </span>
            <span className="text-sm text-muted-foreground">
              {data.now === 1 ? "person" : "people"} on the site right now
            </span>
          </p>
          {summary.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">{summary.join(" · ")}</p>
          )}

          {feed.length > 0 && (
            <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
              {feed.map((row, i) => (
                <li key={`${row.countryCode}-${row.path}-${i}`} className="flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" aria-hidden />
                  <span aria-hidden>{flagEmoji(row.countryCode)}</span>
                  <span className="min-w-0 truncate text-foreground">
                    someone in {countryName(row.countryCode)} is reading{" "}
                    <span className="text-muted-foreground">{row.path}</span>
                  </span>
                  {timeAgo(row.since) && (
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(row.since)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {topCountries.length > 0 && (
            <div className="mt-5 border-t border-border pt-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Visitors · 7d · by country
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {topCountries.map((c) => (
                  <span
                    key={c.countryCode}
                    title={countryName(c.countryCode)}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-border bg-card px-2.5 py-1.5 text-xs text-foreground"
                  >
                    <span aria-hidden>{flagEmoji(c.countryCode)}</span>
                    <span className="sr-only">{countryName(c.countryCode)}</span>
                    <span aria-hidden>{c.countryCode}</span> {numberFormat.format(c.visitors)}
                  </span>
                ))}
                {(data.moreCountries ?? 0) > 0 && (
                  <span className="text-xs text-muted-foreground">+ {data.moreCountries} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
