import Link from "next/link";

export const metadata = {
  title: "Help Center - AI Launch Space",
  description: "Get help with launching your AI project on AI Launch Space.",
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-muted-foreground">
            Get answers to common questions about launching your AI project
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="rounded-xl border border-border bg-muted">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Getting Started</h2>
              <p className="text-muted-foreground">
                Learn how to submit your AI project and enter weekly competitions.
              </p>
              <div className="mt-4 flex justify-end">
                <Link href="/submit" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(0,0,0,1)]">
                  Submit Project
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Pricing Plans</h2>
              <p className="text-muted-foreground">
                Understand the difference between Standard and Premium launches.
              </p>
              <div className="mt-4 flex justify-end">
                <Link href="/pricing" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(0,0,0,1)]">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted">
            <div className="p-6">
              <h2 className="text-lg font-semibold">FAQ</h2>
              <p className="text-muted-foreground">
                Find answers to frequently asked questions about our platform.
              </p>
              <div className="mt-4 flex justify-end">
                <Link href="/faq" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(0,0,0,1)]">
                  Read FAQ
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted">
            <div className="p-6">
              <h2 className="text-lg font-semibold">Contact Support</h2>
              <p className="text-muted-foreground">
                Need more help? Get in touch with our support team.
              </p>
              <div className="mt-4 flex justify-end">
                <Link href="/contact" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgba(0,0,0,1)]">
                  Contact Us
                </Link>
              </div>
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

