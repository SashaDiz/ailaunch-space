import Link from "next/link";
import { Mail, Twitter } from "lucide-react";
import { siteConfig } from "@/config/site.config";

export const metadata = {
  title: `Contact Us - ${siteConfig.name}`,
  description: `Get in touch with the ${siteConfig.name} team.`,
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="rounded-xl border border-border bg-muted">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Email Support</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                For general inquiries, support, and partnership opportunities:
              </p>
              <a
                href={`mailto:${siteConfig.contact.supportEmail}`}
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                {siteConfig.contact.supportEmail}
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Twitter className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Social Media</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Follow us for updates and reach out on Twitter:
              </p>
              <a
                href={`https://twitter.com/${siteConfig.social.twitter?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline font-medium"
              >
                {siteConfig.social.twitter}
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mb-4">
              Before reaching out, you might find your answer in our FAQ section:
            </p>
            <div className="mt-4">
              <Link href="/faq" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)]">
                Visit FAQ
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

