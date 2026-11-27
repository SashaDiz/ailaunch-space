import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { minPlacementPrice } from "@/config/advertising.config";
import { getPlan } from "@/config/plans.config";
import { getSiteStats } from "@/lib/site-stats";
import { compact } from "@/lib/site-stats-math";
import { countryName, flagEmoji } from "@/lib/country";
import { LiveStats } from "@/components/marketing/LiveStats";
import {
  ChartBlock, CumulativeArea, DailyBars, Legend, MonthlyBars, SectionLabel,
} from "@/components/marketing/StatsCharts";

export const revalidate = 600; // numbers refresh every 10 minutes

export async function generateMetadata() {
  const title = `${siteConfig.name} open stats: visitors, launches and makers`;
  const description = `Live, first-party stats for ${siteConfig.name}: visits, countries, new AI tools and makers over the last 30 days.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteConfig.url}/stats` },
    openGraph: { title, description, type: "website" },
  };
}

const numberFormat = new Intl.NumberFormat("en-US");
const fmt = (n: number) => numberFormat.format(n);
const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** One cell of the joined metrics table: snake_case key, value, all-time line. */
function Metric({ name, value, sub }: { name: string; value: string; sub?: string }) {
  return (
    <div className="bg-card px-4 py-3.5">
      <p className="text-[11px] text-muted-foreground">{name}</p>
      <p className="mt-1.5 text-[22px] font-semibold leading-none tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default async function StatsPage() {
  const stats = await getSiteStats();
  const { tiles } = stats;
  const premiumPrice = getPlan("premium")?.price ?? 4.99;
  const listedInWindow = stats.listingsPerDay.reduce((a, d) => a + d.count, 0);
  const makersInWindow = stats.makersPerDay.reduce((a, d) => a + d.count, 0);
  const updated = new Date(stats.generatedAt).toISOString().slice(11, 16);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-5xl px-6 pb-16 pt-14">
        {/* Hero */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Open stats</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {siteConfig.name} in numbers
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          Live numbers from our own first-party counter for the last {stats.windowDays} days, refreshed every 10 minutes.
          Counted without cookies, straight from the browser and our database. Nothing on this page is estimated.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center rounded-[var(--radius)] bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Launch your AI tool
          </Link>
          <Link
            href="/promote"
            className="inline-flex items-center rounded-[var(--radius)] border border-border px-4 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Advertise to makers
          </Link>
        </div>

        {/* Metrics table */}
        <div className="mt-12">
          <SectionLabel aside={`UTC · updated ${updated}`}>Last {stats.windowDays} days · all time</SectionLabel>
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border border-border bg-border md:grid-cols-4">
            <Metric name="visits" value={compact(tiles.visits.window)} sub={`${compact(tiles.visits.allTime)} since ${dateLabel(stats.trackingSince)}`} />
            <Metric name="visitors_per_day" value={fmt(tiles.visitorsPerDay.window)} sub={`peak ${fmt(tiles.visitorsPerDay.peak)}`} />
            <Metric name="ai_tools_listed" value={`+${fmt(tiles.listings.window)}`} sub={`${fmt(tiles.listings.allTime)} live · ${fmt(tiles.premium)} premium`} />
            <Metric name="new_makers" value={`+${fmt(tiles.makers.window)}`} sub={`${fmt(tiles.makers.allTime)} all time`} />
            <Metric name="listing_page_views" value={compact(tiles.listingViews.allTime)} sub="all time" />
            <Metric name="clicks_to_tools" value={compact(tiles.clicks.allTime)} sub="visitors sent to listed sites" />
            <Metric name="countries" value={fmt(tiles.countries.window)} sub={`${fmt(tiles.countries.allTime)} all time`} />
            <Metric name="domain_rating" value={String(tiles.domainRating.value)} sub="ahrefs" />
          </div>
        </div>

        {/* Main chart */}
        <div className="mt-14">
          <ChartBlock
            label="Visits per day"
            height={190}
            aside={<Legend items={[{ label: "counted" }, { label: "today, so far", faded: true }]} />}
          >
            <DailyBars data={stats.visits} dataKey="visits" name="visits" extraKey="visitors" extraName="unique visitors" />
          </ChartBlock>
        </div>

        <div className="mt-14 grid gap-x-12 gap-y-14 md:grid-cols-2">
          <ChartBlock label="Visits per month" aside={`since ${dateLabel(stats.trackingSince)}`}>
            <MonthlyBars data={stats.monthly} />
          </ChartBlock>
          <ChartBlock label="AI tools published per day" aside={`+${fmt(listedInWindow)} in ${stats.windowDays} days`}>
            <DailyBars data={stats.listingsPerDay} dataKey="count" name="published" />
          </ChartBlock>
          <ChartBlock label="Registered makers" aside={`+${fmt(makersInWindow)} in ${stats.windowDays} days`}>
            <CumulativeArea data={stats.makersPerDay} name="makers" />
          </ChartBlock>

          {/* Countries */}
          <section>
            <SectionLabel aside={`share of visits, ${stats.windowDays} days`}>Countries</SectionLabel>
            <ul className="mt-3">
              {stats.countries.slice(0, 7).map((row, index) => (
                <li
                  key={row.key}
                  className={`flex items-center justify-between gap-3 rounded-[var(--radius)] px-2 py-1.5 text-[13px] ${index === 0 ? "bg-muted/70" : ""}`}
                >
                  <span className="flex min-w-0 items-center gap-2 text-foreground/85">
                    <span aria-hidden className="text-[12px]">{flagEmoji(row.key)}</span>
                    <span className="truncate">{countryName(row.key)}</span>
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{(row.share * 100).toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* What you get */}
        <section className="mt-14">
          <SectionLabel>What you get</SectionLabel>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">Launch your AI tool</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                A listing on a site with ~{compact(tiles.visits.window)} visits a month from {fmt(tiles.countries.window)} countries,
                which has already sent {fmt(tiles.clicks.allTime)} visitors to listed tools, plus a dofollow link from a DR{" "}
                {tiles.domainRating.value} domain. Free with our badge, or ${premiumPrice} for Premium: live instantly and pinned at the top.
              </p>
              <Link href="/pricing" className="mt-4 inline-block text-[13px] font-semibold text-primary hover:underline">
                Launch your tool →
              </Link>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-card p-5">
              <h3 className="text-[15px] font-semibold text-foreground">Advertise</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Fixed spots in front of {fmt(tiles.makers.allTime)} registered makers and every visitor: top banner, side rails,
                homepage logos and project pages. Pay once for 30 days, no auto-renewal, from ${minPlacementPrice}.
              </p>
              <Link href="/promote" className="mt-4 inline-block text-[13px] font-semibold text-primary hover:underline">
                See ad spots →
              </Link>
            </div>
          </div>
        </section>

        {/* Right now */}
        <section className="mt-14">
          <SectionLabel>Right now</SectionLabel>
          <LiveStats />
        </section>

        {/* Methodology */}
        <section className="mt-10 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          <p>
            How we count: visits come from our own cookieless pageview counter, running since {dateLabel(stats.trackingSince)}.
            It runs in the browser, so crawlers that do not execute JavaScript are not counted. One visit is one browser
            session; unique visitors are counted per day from an anonymised hash. Countries come from the same counter.
            Listings are projects live in the directory, dated by when they were published; makers are registered accounts.
            Listing page views and clicks to listed sites are counted per project since each listing went live. Domain
            Rating is reported by Ahrefs. All days are UTC.
          </p>
        </section>
      </div>
    </div>
  );
}
