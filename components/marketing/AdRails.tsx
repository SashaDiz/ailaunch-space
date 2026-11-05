"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, ArrowUpRight } from "lucide-react";
import {
  PaidPlacementCard,
  getVisitUrl,
  trackPlacementClick,
} from "@/components/directory/PaidPlacementCard";
import { getLogoDevUrl } from "@/lib/utils";
import { siteConfig } from "@/config/site.config";

/**
 * Side ad rails.
 *
 * The Side Rail Card placement: two columns pinned to the viewport edges on
 * wide screens. Below the wide breakpoint
 * they become two slow tickers pinned to the top and bottom of the screen
 * (left rail on top, right rail below) — the catalog needs the whole width
 * there.
 *
 * Fetched on the client: MainLayout persists across navigation, and a DB
 * read here would turn every page that uses the layout dynamic. The rails
 * and the tickers share one request.
 *
 * The rails must render outside the page card: its `backdrop-blur` makes it
 * the containing block for `position: fixed`, which would pin them to the
 * card instead of the viewport.
 */

type RailItem = React.ComponentProps<typeof PaidPlacementCard>["project"];

type RailData = {
  items: RailItem[];
  /** Whether a spot can be bought: the open-slot card only shows if so. */
  hasOpenSlot: boolean;
};

const NO_RAIL_DATA: RailData = { items: [], hasOpenSlot: false };

/**
 * Promotions bought with the rail placement. Premium listings are not
 * adverts and stay in the catalog.
 */
async function fetchRailData(): Promise<RailData> {
  const res = await fetch("/api/promotions?type=rail").catch(() => null);
  if (!res?.ok) return NO_RAIL_DATA;
  const data = await res.json();
  return {
    hasOpenSlot: data.available === true,
    items: (data.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.id,
      logo_url: p.logo_url,
      short_description: p.catalog_detail_text || p.short_description,
      website_url: p.website_url,
      promotion_id: p.id,
      cta_text: p.cta_text,
    })),
  };
}

let pending: Promise<RailData> | null = null;

function useRailData(): RailData {
  const [data, setData] = useState<RailData>(NO_RAIL_DATA);

  useEffect(() => {
    let cancelled = false;
    pending ??= fetchRailData().catch((error) => {
      console.error("AdRails: failed to load placements:", error);
      pending = null;
      return NO_RAIL_DATA;
    });
    pending.then((next) => {
      if (!cancelled) setData(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

function RailLabel() {
  return (
    <p className="inline-flex w-fit items-center gap-1.5 rounded-sm border border-border/40 bg-background/80 px-2 py-0.5 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <Megaphone className="h-3 w-3" aria-hidden />
      Sponsored
    </p>
  );
}

/** The open slot is the advert for the advert slot. */
function OpenSlotCard({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/promote"
      // Liquid glass: it sits straight on the animated shader, so the blur
      // and saturation keep the text legible over the dot pattern.
      className={`block shrink-0 rounded-[var(--radius)] border border-dashed border-foreground/20 bg-background/55 p-4 text-center shadow-[inset_0_1px_0_hsl(0_0%_100%/0.5)] backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-background/75 dark:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08)] ${compact ? "w-[14rem]" : ""}`}
    >
      <p className="text-sm font-semibold text-foreground">Your product here</p>
      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        Advertise on {siteConfig.name}
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      </p>
    </Link>
  );
}

export function AdRails() {
  const { items, hasOpenSlot } = useRailData();

  // Alternate so both rails fill evenly as placements are sold.
  const left = items.filter((_, i) => i % 2 === 0);
  const right = items.filter((_, i) => i % 2 === 1);

  return (
    <>
      <aside aria-label="Sponsored, left rail" className="ad-rail ad-rail-left">
        <RailLabel />
        {left.map((item) => (
          <PaidPlacementCard key={item.id} project={item} variant="rail" />
        ))}
        {hasOpenSlot && <OpenSlotCard />}
      </aside>

      <aside aria-label="Sponsored, right rail" className="ad-rail ad-rail-right">
        <RailLabel />
        {right.map((item) => (
          <PaidPlacementCard key={item.id} project={item} variant="rail" />
        ))}
        {hasOpenSlot && <OpenSlotCard />}
      </aside>
    </>
  );
}

function TickerItem({ item }: { item: RailItem }) {
  const visit = getVisitUrl(item);
  const logo = item.logo_url || getLogoDevUrl(item.website_url);
  return (
    <a
      href={visit.url}
      target="_blank"
      rel={visit.rel}
      onClick={() => trackPlacementClick(item)}
      className="flex shrink-0 items-center gap-2 text-sm font-medium text-foreground hover:underline"
    >
      {logo ? (
        <img src={logo} alt="" width={20} height={20} loading="lazy" className="h-5 w-5 rounded object-cover" />
      ) : (
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px]">
          {item.name?.[0] ?? "?"}
        </span>
      )}
      {item.name}
    </a>
  );
}

function TickerSlot() {
  return (
    <Link href="/promote" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
      + your product here
    </Link>
  );
}

/**
 * One fixed bar with a slow marquee. The sequence is laid out twice and
 * the track slides by exactly one copy, so the loop has no seam; each copy
 * repeats the items enough to be wider than any screen the bar shows on.
 */
function Ticker({
  items,
  position,
  hasOpenSlot,
}: {
  items: RailItem[];
  position: "top" | "bottom";
  hasOpenSlot: boolean;
}) {
  const sequence = [0, 1, 2].flatMap((round) => [
    ...items.map((item) => <TickerItem key={`${round}-${item.id}`} item={item} />),
    ...(hasOpenSlot ? [<TickerSlot key={`${round}-slot`} />] : []),
  ]);
  // ~6s per entry keeps the speed the same however many ads are sold.
  const duration = `${Math.max(20, sequence.length * 6)}s`;

  return (
    <aside
      aria-label={`Sponsored, ${position} bar`}
      className={`ad-ticker ad-ticker-${position}`}
    >
      <div className="ad-ticker-track" style={{ animationDuration: duration }}>
        <div className="flex shrink-0 items-center gap-10 pr-10">{sequence}</div>
        {/* The loop's second copy: hidden from screen readers and tab order. */}
        <div className="flex shrink-0 items-center gap-10 pr-10" aria-hidden inert>
          {sequence}
        </div>
      </div>
    </aside>
  );
}

/**
 * The narrow-screen form of the rails: two slow tickers pinned to the top
 * and bottom of the viewport. Like the rails, render outside the page card.
 */
export function AdTickers() {
  // Always rendered, like the rails: with nothing sold the bars still carry
  // the open slot, and MainLayout has reserved their height regardless.
  const { items, hasOpenSlot } = useRailData();
  const top = items.filter((_, i) => i % 2 === 0);
  const bottom = items.filter((_, i) => i % 2 === 1);

  return (
    <>
      <Ticker items={top} position="top" hasOpenSlot={hasOpenSlot} />
      <Ticker items={bottom.length > 0 ? bottom : top} position="bottom" hasOpenSlot={hasOpenSlot} />
    </>
  );
}
