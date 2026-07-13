import Link from "next/link";
import { siteConfig } from "@/config/site.config";

export async function generateMetadata() {
  return {
    title: `Submission Policy - ${siteConfig.name}`,
    description: `What can and cannot be listed on ${siteConfig.name}. Eligibility, prohibited categories, and how our review process works.`,
    alternates: {
      canonical: `${siteConfig.url}/submission-policy`,
    },
  };
}

export default function SubmissionPolicyPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-8">Submission &amp; Content Policy</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

            <p className="text-muted-foreground mb-4">
              {siteConfig.name} is a curated directory of digital products. To keep the directory
              trustworthy — and to comply with the requirements of our payment and infrastructure
              providers — every submission is reviewed before it goes live and must meet the
              standards below. By submitting a project you confirm that it complies with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What we accept</h2>
            <p className="text-muted-foreground mb-4">We list legitimate, digitally delivered products such as:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>SaaS products, web apps, and mobile apps</li>
              <li>AI tools and developer tools</li>
              <li>No-code / low-code platforms and templates</li>
              <li>Productivity, marketing, design, and other business software</li>
            </ul>
            <p className="text-muted-foreground mb-4">To be eligible, a submission must:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Be a working, publicly accessible product (no placeholder, teaser, waitlist, or &quot;coming soon&quot; pages)</li>
              <li>Be owned by you or submitted with the owner&apos;s authorization</li>
              <li>Provide accurate information and a functioning website</li>
              <li>Deliver its value digitally and comply with all applicable laws</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Prohibited categories</h2>
            <p className="text-muted-foreground mb-4">
              We do not list products that fall into the categories below. This list mirrors the
              acceptable-use requirements of our payment providers, and submissions in these areas
              will be rejected or removed.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.1 Adult &amp; NSFW</h3>
            <p className="text-muted-foreground mb-4">
              Explicit or suggestive content or services, whether real or AI-generated — including
              NSFW chatbots, AI companions or &quot;AI girlfriend/boyfriend&quot; apps, adult content
              platforms, webcam or escort-style services, and erotic games.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.2 Deepfakes &amp; impersonation</h3>
            <p className="text-muted-foreground mb-4">
              Tools whose primary purpose is face-swapping, animating a real person&apos;s photo into
              video, voice cloning of real or public people, or otherwise impersonating individuals,
              as well as tools that scrape or collect personal data without a clear legal basis.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.3 Intellectual-property infringement &amp; piracy</h3>
            <p className="text-muted-foreground mb-4">
              Watermark removers, AI-detection evaders or &quot;humanizers&quot; sold to bypass
              detection, unauthorized media/video downloaders, pirated software, licenses or media,
              and counterfeit goods.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.4 Fake engagement, spam &amp; scraping</h3>
            <p className="text-muted-foreground mb-4">
              Services that sell followers, likes, views, or other engagement; bot or automated
              comment/outreach tools; and lead-scraping or mass-outreach/spam tools.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.5 Gambling &amp; chance-based mechanics</h3>
            <p className="text-muted-foreground mb-4">
              Casinos, betting, lotteries, sweepstakes, cash-prize fantasy sports, and chance-based
              reward mechanics such as loot boxes or spins.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.6 Crypto &amp; unlicensed financial products</h3>
            <p className="text-muted-foreground mb-4">
              Token launches, crypto wallets, exchanges, NFTs, and DeFi; and unlicensed financial
              tools, investment strategies, trading signals, wealth-building courses, or banking
              services.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.7 Regulated health, pharma &amp; wellness</h3>
            <p className="text-muted-foreground mb-4">
              Prescription medicines (including GLP-1, HRT, and peptides), supplements, diagnostics,
              weight-loss programs, and any product making unverifiable health claims.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.8 Physical goods &amp; manual services</h3>
            <p className="text-muted-foreground mb-4">
              Physical products and in-person services (we list digitally delivered products only),
              and businesses whose core offering is manual, one-off work such as freelancing,
              consulting, or agency services rather than a product.
            </p>

            <h3 className="text-xl font-semibold mb-3">2.9 Illegal or harmful</h3>
            <p className="text-muted-foreground mb-4">
              Anything unlawful or that facilitates fraud, malware, surveillance/stalkerware, hate,
              or harm to others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Review &amp; moderation</h2>
            <p className="text-muted-foreground mb-4">
              Every submission is reviewed by our team before it goes live. We may approve, reject,
              or remove any listing at our discretion, including after it has been published, if it
              does not comply with this policy.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>If your submission is rejected, we email you the reason so you can address it.</li>
              <li>You are welcome to fix the issue and resubmit.</li>
              <li>We may remove previously approved listings if they later fall out of compliance.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Questions</h2>
            <p className="text-muted-foreground">
              Not sure whether your product qualifies? Reach out before submitting via our{" "}
              <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                contact page
              </Link>{" "}
              or at{" "}
              <a
                href={`mailto:${siteConfig.contact.supportEmail}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {siteConfig.contact.supportEmail}
              </a>
              . This policy complements our{" "}
              <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
