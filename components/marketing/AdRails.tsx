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
 * The catalog's paid placements (active promotions with the `catalog`
 * placement), moved out of the project grid into two columns
 * pinned to the viewport edges on wide screens. Below the wide breakpoint
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

/** Cards per rail; each ticker carries one rail's worth. */
const PER_RAIL = 3;

type RailItem = React.ComponentProps<typeof PaidPlacementCard>["project"];

/**
 * Paid placements only: active promotions bought with the `catalog`
 * placement. Premium listings are not adverts and stay in the catalog.
 */
async function fetchRailItems(): Promise<RailItem[]> {
  const res = await fetch("/api/promotions?type=catalog").catch(() => null);
  if (!res?.ok) return [];
  const data = await res.json();
  return (data.data || []).slice(0, PER_RAIL * 2).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.id,
    logo_url: p.logo_url,
    short_description: p.short_description,
    website_url: p.website_url,
    promotion_id: p.id,
    cta_text: p.cta_text,
  }));
}

let pending: Promise<RailItem[]> | null = null;

function useRailItems(): RailItem[] {
  const [items, setItems] = useState<RailItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    pending ??= fetchRailItems().catch((error) => {
      console.error("AdRails: failed to load placements:", error);
      pending = null;
      return [];
    });
    pending.then((next) => {
      if (!cancelled) setItems(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return items;
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
  const items = useRailItems();

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
        <OpenSlotCard />
      </aside>

      <aside aria-label="Sponsored, right rail" className="ad-rail ad-rail-right">
        <RailLabel />
        {right.map((item) => (
          <PaidPlacementCard key={item.id} project={item} variant="rail" />
        ))}
        <OpenSlotCard />
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
function Ticker({ items, position }: { items: RailItem[]; position: "top" | "bottom" }) {
  const sequence = [0, 1, 2].flatMap((round) => [
    ...items.map((item) => <TickerItem key={`${round}-${item.id}`} item={item} />),
    <TickerSlot key={`${round}-slot`} />,
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
  const items = useRailItems();
  const top = items.filter((_, i) => i % 2 === 0);
  const bottom = items.filter((_, i) => i % 2 === 1);

  return (
    <>
      <Ticker items={top} position="top" />
      <Ticker items={bottom.length > 0 ? bottom : top} position="bottom" />
    </>
  );
}
