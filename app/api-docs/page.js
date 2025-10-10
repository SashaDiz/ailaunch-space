import Link from "next/link";

export const metadata = {
  title: "API Documentation - AI Launch Space",
  description: "API documentation for developers integrating with AI Launch Space.",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
          <p className="text-lg text-base-content/70 mb-8">
            API documentation coming soon. Contact us if you need early access.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact" className="btn btn-primary">
              Contact Us
            </Link>
            <Link href="/" className="btn btn-ghost">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

