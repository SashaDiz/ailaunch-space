import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - AI Launch Space",
  description: "Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-base-content/70 mb-4">
              At AI Launch Space, we take your privacy seriously. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-base-content/70 mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Account information (name, email address)</li>
              <li>AI project information you submit</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Communication preferences</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-base-content/70 mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your AI project submissions</li>
              <li>Send you updates about competitions and your projects</li>
              <li>Respond to your comments and questions</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
            <p className="text-base-content/70 mb-4">
              We do not sell your personal information. We may share your information only in the 
              following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>With service providers who assist in operating our platform</li>
              <li>To protect our rights and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="text-base-content/70 mb-4">
              We implement appropriate security measures to protect your personal information. 
              However, no method of transmission over the internet is 100% secure, and we cannot 
              guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-base-content/70 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-base-content/70">
              If you have any questions about this Privacy Policy, please contact us through our{" "}
              <Link href="/contact" className="link link-primary">
                contact page
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <p className="text-sm text-base-content/60">
              Last updated: October 2025
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="btn btn-ghost">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

