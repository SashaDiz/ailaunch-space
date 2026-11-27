import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { getPlan } from "@/config/plans.config";
import { LAUNCH_PLATFORM_TYPES, launchPlatforms } from "@/config/launch-platforms.config";
import { getDomainRating, SITE_DOMAIN } from "@/lib/domain-rating";
import { LaunchPlatformsTable, type PlatformRow } from "@/components/marketing/LaunchPlatformsTable";

export const revalidate = 86400; // Domain Ratings move slowly: refresh once a day

const year = () => new Date().getUTCFullYear();

export async function generateMetadata() {
  const title = `Where to launch your AI tool in ${year()}: ${launchPlatforms.length} directories ranked by Domain Rating`;
  const description = `AI tool directories, launch platforms and communities where makers can list an AI product, ranked by their live Ahrefs Domain Rating.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteConfig.url}/launch-platforms` },
    openGraph: { title, description, type: "website" },
  };
}

/** Live DR for every platform, a few requests at a time. A failed lookup stays null. */
async function withDomainRatings(): Promise<PlatformRow[]> {
  const rows: PlatformRow[] = [];
  for (let i = 0; i < launchPlatforms.length; i += 6) {
    const batch = await Promise.all(launchPlatforms.slice(i, i + 6).map(async (p) => {
      const rating = await getDomainRating(p.domain);
      return { ...p, typeLabel: LAUNCH_PLATFORM_TYPES[p.type], dr: rating.live ? rating.dr : null };
    }));
    rows.push(...batch);
  }
  return rows.sort((a, b) => (b.dr ?? -1) - (a.dr ?? -1) || a.name.localeCompare(b.name));
}

export default async function LaunchPlatformsPage() {
  const [rows, own] = await Promise.all([withDomainRatings(), getDomainRating(SITE_DOMAIN)]);
  const premiumPrice = getPlan("premium")?.price ?? 4.99;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-5xl px-6 pb-16 pt-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">For makers</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Where to launch your AI tool</h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
          {rows.length} AI directories, launch platforms and communities that take submissions, ranked by their Domain
          Rating from Ahrefs. A higher DR means a backlink from that site carries more weight. Ratings refresh daily.
        </p>

        {/* Our own listing, kept apart from the ranked list */}
        <div className="mt-8 flex flex-col gap-4 rounded-[var(--radius)] border border-primary/40 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Start here</p>
            <p className="mt-1 text-[14px] font-semibold text-foreground">
              {siteConfig.name} {own.live ? `· DR ${own.dr}` : ""}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Free with our badge and a dofollow link, or ${premiumPrice} to go live today with a lifetime dofollow link.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Submit your AI tool
          </Link>
        </div>

        <div className="mt-10">
          <LaunchPlatformsTable rows={rows} />
        </div>

        <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
          Domain Rating is reported by Ahrefs and refreshed once a day; “—” means Ahrefs did not return a rating today.
          We do not run or endorse these sites, and links to them are nofollow. Submission rules and prices are set by
          each platform.
        </p>
      </div>
    </div>
  );
}
