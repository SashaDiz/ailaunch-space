import React from "react";
import Link from "next/link";
import { NewsletterSignup } from "@/components/forms/NewsletterSignup";
import { SocialFollow } from "@/components/shared/SocialShare";
import { ThemeAwareLogo } from "@/components/shared/ThemeAwareLogo";
import { siteConfig } from "@/config/site.config";
import { getCategoriesWithCounts } from "@/lib/categories-with-counts";

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
    <footer className="border-t border-border bg-transparent">
      <div className="container-classic py-10">
        {/* Brand + newsletter */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" aria-label={siteConfig.name} className="shrink-0">
              <ThemeAwareLogo variant="default" height={36} width={115} className="h-9 w-auto" />
            </Link>
            <p className="max-w-xs text-[13px] leading-snug text-muted-foreground">
              The best new AI tools in your inbox. Unsubscribe anytime.
            </p>
          </div>
          <div className="w-full md:max-w-sm">
            <NewsletterSignup variant="inline" source="footer" placeholder="Enter your email" buttonText="Subscribe" />
          </div>
        </div>

        {/* Link columns: four groups plus popular categories */}
        <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
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
        <div className="mt-9 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {siteConfig.footer.copyright} Made by{" "}
            <a
              href="https://alexanderosso.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Alex Osso
            </a>
            .
          </p>
          <SocialFollow variant="horizontal" size="sm" className="flex space-x-3" />
        </div>

        <a href="https://dododirectory.com" target="_blank" rel="dofollow" className="sr-only">
          Featured on DodoDirectory
        </a>
      </div>
    </footer>
  );
}
