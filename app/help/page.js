import Link from "next/link";

export const metadata = {
  title: "Help Center - AI Launch Space",
  description: "Get help with launching your AI project on AI Launch Space.",
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-lg text-base-content/70">
            Get answers to common questions about launching your AI project
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Getting Started</h2>
              <p className="text-base-content/70">
                Learn how to submit your AI project and enter weekly competitions.
              </p>
              <div className="card-actions justify-end">
                <Link href="/submit" className="btn btn-primary btn-sm">
                  Submit Project
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Pricing Plans</h2>
              <p className="text-base-content/70">
                Understand the difference between Standard and Premium launches.
              </p>
              <div className="card-actions justify-end">
                <Link href="/pricing" className="btn btn-primary btn-sm">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">FAQ</h2>
              <p className="text-base-content/70">
                Find answers to frequently asked questions about our platform.
              </p>
              <div className="card-actions justify-end">
                <Link href="/faq" className="btn btn-primary btn-sm">
                  Read FAQ
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Contact Support</h2>
              <p className="text-base-content/70">
                Need more help? Get in touch with our support team.
              </p>
              <div className="card-actions justify-end">
                <Link href="/contact" className="btn btn-primary btn-sm">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="btn btn-ghost">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

