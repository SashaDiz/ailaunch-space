import React from "react";
import Link from "next/link";
import { NewsletterSignup } from "@/components/forms/NewsletterSignup";
import { SocialFollow } from "@/components/shared/SocialShare";
import { ThemeAwareLogo } from "@/components/shared/ThemeAwareLogo";
import { siteConfig } from "@/config/site.config";

const OTHER_PROJECTS = [
  { name: "PosteAhora", href: "https://posteahora.com/" },
  { name: "Mulu", href: "https://www.mulujournal.app/" },
  { name: "Winery Hotels", href: "https://winery-hotels.com/" },
  { name: "Directory Launch", href: "https://directory-launch.com/" },
  { name: "Momentum", href: "https://getmomentum.online" },
  { name: "TravelApps", href: "https://besttravelapps.online/" },
];

export function Footer() {
  return (
    <footer className="bg-transparent border-t border-border">
      <div className="container-classic py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          {/* Brand */}
          <div className="space-y-4 lg:max-w-xs">
            <Link href="/">
              <ThemeAwareLogo
                variant="default"
                height={44}
                width={140}
                priority
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-muted-foreground text-sm">
              {siteConfig.footer.description}
            </p>
            <SocialFollow
              variant="horizontal"
              size="md"
              className="flex space-x-3"
            />
          </div>

          {/* Link columns — sized to content, not stretched to equal widths */}
          <div className="flex flex-wrap gap-x-12 gap-y-8 sm:gap-x-16 lg:gap-x-20">
            {/* Platform */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground leading-none">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/#projects-section"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Browse
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submit"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Submit Project
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground leading-none">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/blog"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    FAQs
                  </Link>
                </li>
                {/* CHANGELOG FEATURE DISABLED - COMMENTED OUT FOR FUTURE DEVELOPMENT
                <li>
                  <Link
                    href="/changelog"
                    className="text-background/70 hover:text-background transition-colors"
                  >
                    Changelog
                  </Link>
                </li>
                */}
              </ul>
            </div>

            {/* Other Projects */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-foreground leading-none">
                Other Projects
              </h3>
              <ul className="space-y-2 text-sm">
                {OTHER_PROJECTS.map((project) => (
                  <li key={project.href}>
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {project.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Stay Updated */}
          <div className="w-full lg:w-auto lg:max-w-xs">
            <NewsletterSignup
              variant="footer"
              source="footer"
              placeholder="your@email.com"
              buttonText="Subscribe"
            />
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <p>{siteConfig.footer.copyright}</p>
              <p>
                Made by{" "}
                <a
                  href="https://alexanderosso.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold transition-colors underline-offset-4 hover:underline hover:text-primary/80"
                >
                  Alex Osso
                </a>
              </p>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/cookies"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookies
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        <a
          href="https://dododirectory.com"
          target="_blank"
          rel="dofollow"
          className="sr-only"
        >
          Featured on DodoDirectory
        </a>
      </div>
    </footer>
  );
}
