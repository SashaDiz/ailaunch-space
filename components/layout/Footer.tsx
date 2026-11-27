import React from "react";
import { Silkscreen } from "next/font/google";
import Link from "next/link";
import { NewsletterSignup } from "@/components/forms/NewsletterSignup";
import { SocialFollow } from "@/components/shared/SocialShare";
import { ThemeAwareLogo } from "@/components/shared/ThemeAwareLogo";
import { siteConfig } from "@/config/site.config";
import { getCategoriesWithCounts } from "@/lib/categories-with-counts";

/** Blocky pixel face for the oversized wordmark only. */
const pixelFont = Silkscreen({ weight: "400", subsets: ["latin"], display: "swap" });

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Discover",
    links: [
      { label: "New AI tools", href: "/#projects-section" },
      { label: "Stats", href: "/stats" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "For makers",
    links: [
      { label: "Submit your project", href: "/pricing" },
      { label: "Advertise", href: "/promote" },
      { label: "Where to launch", href: "/launch-platforms" },
      { label: "Submission policy", href: "/submission-policy" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
  {
    title: "More from us",
    links: [
      { label: "PosteAhora", href: "https://posteahora.com/", external: true },
      { label: "Directory Launch", href: "https://directory-launch.com/", external: true },
      { label: "Winery Hotels", href: "https://winery-hotels.com/", external: true },
      { label: "TravelApps", href: "https://besttravelapps.online/", external: true },
    ],
  },
];

const POPULAR_CATEGORIES = 6;
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";
const linkClass = "text-[13px] text-foreground/75 transition-colors hover:text-foreground";


export async function Footer() {
  const categories = await getCategoriesWithCounts().catch(() => []);
  const popular = [...categories]
    .filter((c) => c.app_count > 0)
    .sort((a, b) => b.app_count - a.app_count || a.name.localeCompare(b.name))
    .slice(0, POPULAR_CATEGORIES);

  return (
    <footer className="relative overflow-hidden border-t border-border bg-transparent" style={{ containerType: "inline-size" }}>
      <div className="container-classic relative pb-6 pt-12">
        {/* Brand (logo, then what the site is) and the newsletter */}
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-sm">
            <Link href="/" aria-label={siteConfig.name} className="inline-block">
              <ThemeAwareLogo variant="default" height={40} width={128} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              {siteConfig.footer.description}
            </p>
          </div>
          <div className="w-full md:max-w-sm">
            <div className="flex items-center justify-between">
              <p className={labelClass}>Newsletter</p>
              <SocialFollow variant="horizontal" size="sm" className="flex space-x-3" />
            </div>
            <div className="mt-2.5">
              <NewsletterSignup variant="inline" source="footer" placeholder="you@email.com" buttonText="Subscribe" />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-border pt-10 sm:grid-cols-3 lg:grid-cols-5">
          {/* Link columns: four groups plus popular categories */}
          {[...COLUMNS.slice(0, 2), {
            title: "Popular categories",
            links: [
              ...popular.map((c) => ({ label: c.name, href: `/categories/${c.slug}` })),
              { label: "All categories →", href: "/categories" },
            ],
          }, ...COLUMNS.slice(2)].map((column) => (
            <div key={column.title}>
              <h3 className={labelClass}>{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link: FooterLink) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom line */}
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{siteConfig.footer.copyright}</p>
          <p>
            Made by{" "}
            <a
              href="https://alexanderosso.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Alex Osso
            </a>
          </p>
        </div>

        <a href="https://dododirectory.com" target="_blank" rel="dofollow" className="sr-only">
          Featured on DodoDirectory
        </a>
      </div>

      {/* Oversized wordmark, the signature detail: a huge pixel marquee that
          drifts right to left forever, cut by the footer's sides and its lower
          edge. Two copies make the loop seamless: the track moves by exactly
          one copy's width. Sized in container units of the footer. */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <div
          className={`${pixelFont.className} footer-marquee flex w-max whitespace-nowrap uppercase leading-[0.8] text-foreground/[0.09]`}
          style={{ fontSize: "28cqw", marginBottom: "-0.2em" }}
        >
          {[0, 1].map((copy) => (
            <span key={copy} className="pr-[0.6em]">{siteConfig.name}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
