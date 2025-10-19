import Link from "next/link";

export const metadata = {
  title: "Cookie Policy - AI Launch Space",
  description: "Learn about how we use cookies on AI Launch Space.",
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        
        <div className="prose max-w-none">
          <section className="mb-8">
            <p className="text-sm text-base-content/60 mb-8">
              Last updated: October 2025
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
            <p className="text-base-content/70 mb-4">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit our website. They contain information that is transferred to your device's hard drive and help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
            </p>
            <p className="text-base-content/70 mb-4">
              Cookies can be "persistent" (stored on your device until they expire or you delete them) or "session" cookies (deleted when you close your browser). They can also be "first-party" cookies (set by us) or "third-party" cookies (set by other services we use).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
            <p className="text-base-content/70 mb-4">
              We use cookies for various purposes to enhance your experience on our Platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Authentication:</strong> Keep you signed in to your account securely</li>
              <li><strong>Preferences:</strong> Remember your settings and preferences</li>
              <li><strong>Security:</strong> Protect against fraud and unauthorized access</li>
              <li><strong>Performance:</strong> Monitor and improve platform performance</li>
              <li><strong>Analytics:</strong> Understand how you use our platform</li>
              <li><strong>Personalization:</strong> Provide customized content and recommendations</li>
              <li><strong>Marketing:</strong> Deliver relevant advertisements and promotions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-xl font-semibold mb-2">3.1 Essential Cookies (Necessary)</h3>
                <p className="text-base-content/70 mb-2">
                  These cookies are strictly necessary for the website to function properly. They enable core functionality such as security, authentication, and accessibility.
                </p>
                <p className="text-sm text-base-content/60 mb-2">
                  <strong>Legal Basis:</strong> Legitimate interest and necessity for service provision
                </p>
                <p className="text-sm text-base-content/60 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-base-content/60">
                  <li>Session management and user authentication</li>
                  <li>Security and fraud prevention</li>
                  <li>Load balancing and performance optimization</li>
                  <li>Cookie consent preferences</li>
                </ul>
              </div>

              <div className="border-l-4 border-secondary pl-4">
                <h3 className="text-xl font-semibold mb-2">3.2 Functional Cookies</h3>
                <p className="text-base-content/70 mb-2">
                  These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
                </p>
                <p className="text-sm text-base-content/60 mb-2">
                  <strong>Legal Basis:</strong> Consent (where required by law)
                </p>
                <p className="text-sm text-base-content/60 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-base-content/60">
                  <li>Language and region preferences</li>
                  <li>Display settings and themes</li>
                  <li>Form data and input preferences</li>
                  <li>User interface customizations</li>
                </ul>
              </div>

              <div className="border-l-4 border-accent pl-4">
                <h3 className="text-xl font-semibold mb-2">3.3 Analytics Cookies</h3>
                <p className="text-base-content/70 mb-2">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
                <p className="text-sm text-base-content/60 mb-2">
                  <strong>Legal Basis:</strong> Consent (where required by law)
                </p>
                <p className="text-sm text-base-content/60 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-base-content/60">
                  <li>Page views and user journey tracking</li>
                  <li>Performance metrics and error monitoring</li>
                  <li>User behavior analysis</li>
                  <li>Feature usage statistics</li>
                </ul>
              </div>

              <div className="border-l-4 border-info pl-4">
                <h3 className="text-xl font-semibold mb-2">3.4 Marketing Cookies</h3>
                <p className="text-base-content/70 mb-2">
                  These cookies are used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.
                </p>
                <p className="text-sm text-base-content/60 mb-2">
                  <strong>Legal Basis:</strong> Consent (where required by law)
                </p>
                <p className="text-sm text-base-content/60 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-base-content/60">
                  <li>Ad targeting and personalization</li>
                  <li>Campaign performance tracking</li>
                  <li>Conversion tracking and attribution</li>
                  <li>Retargeting and remarketing</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
            <p className="text-base-content/70 mb-4">
              We may use third-party services that set their own cookies on our Platform. These include:
            </p>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Authentication Services</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Supabase Auth:</strong> User authentication and session management</li>
              <li><strong>OAuth Providers:</strong> Social login integrations (Google, GitHub, etc.)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.2 Payment Processing</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Lemon Squeezy:</strong> Payment processing and transaction management</li>
              <li><strong>Payment Gateways:</strong> Secure payment form functionality</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.3 Analytics and Performance</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Rybbit Analytics:</strong> Privacy-friendly website analytics without cookies</li>
              <li><strong>Performance Monitoring:</strong> Website speed and reliability monitoring</li>
              <li><strong>Error Tracking:</strong> Bug detection and performance optimization</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.4 Communication Services</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Email Services:</strong> Newsletter delivery and email tracking</li>
              <li><strong>Customer Support:</strong> Chat widgets and support tools</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Rybbit Analytics - No Cookies Required</h2>
            <p className="text-base-content/70 mb-4">
              We use Rybbit analytics to understand how visitors interact with our Platform. Unlike traditional analytics services, Rybbit does not use cookies for tracking, making it fully compliant with privacy regulations.
            </p>
            
            <h3 className="text-xl font-semibold mb-3">5.1 How Rybbit Works</h3>
            <p className="text-base-content/70 mb-4">
              Rybbit analytics operates without cookies by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Using server-side tracking instead of client-side cookies</li>
              <li>Collecting only anonymous, aggregated data</li>
              <li>Not storing any personal identifiers</li>
              <li>Operating in compliance with GDPR, CCPA, and other privacy laws</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-3">5.2 Data Collected by Rybbit</h3>
            <p className="text-base-content/70 mb-4">
              Rybbit collects anonymous information including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Page views and navigation patterns</li>
              <li>Referrer information (which website brought you here)</li>
              <li>Browser type and device information</li>
              <li>General geographic location (country/region only)</li>
              <li>Website performance metrics</li>
            </ul>
            
            <p className="text-base-content/70 mb-4">
              <strong>Important:</strong> Since Rybbit doesn't use cookies, you don't need to manage cookie preferences for this analytics service. The data collection is automatic and anonymous.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookie Retention Periods</h2>
            <p className="text-base-content/70 mb-4">
              Different cookies have different retention periods:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device for a set period (typically 30 days to 2 years)</li>
              <li><strong>Authentication Cookies:</strong> Usually expire after 30 days of inactivity</li>
              <li><strong>Preference Cookies:</strong> Typically retained for 1 year</li>
              <li><strong>Analytics Cookies:</strong> Usually retained for 2 years</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Managing Your Cookie Preferences</h2>
            
            <h3 className="text-xl font-semibold mb-3">7.1 Cookie Consent Banner</h3>
            <p className="text-base-content/70 mb-4">
              When you first visit our Platform, you'll see a cookie consent banner that allows you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Accept all cookies</li>
              <li>Reject non-essential cookies</li>
              <li>Customize your cookie preferences by category</li>
              <li>Learn more about our cookie usage</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.2 Browser Settings</h3>
            <p className="text-base-content/70 mb-4">
              You can also control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Block all cookies</li>
              <li>Block third-party cookies only</li>
              <li>Delete existing cookies</li>
              <li>Set preferences for specific websites</li>
              <li>Receive notifications when cookies are set</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.3 Browser-Specific Instructions</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Impact of Disabling Cookies</h2>
            <p className="text-base-content/70 mb-4">
              Please note that disabling certain cookies may impact your experience on our Platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Essential Cookies:</strong> Disabling these may prevent the website from functioning properly</li>
              <li><strong>Authentication:</strong> You may need to log in repeatedly</li>
              <li><strong>Preferences:</strong> Your settings may not be remembered</li>
              <li><strong>Performance:</strong> The website may load slower or display incorrectly</li>
              <li><strong>Features:</strong> Some features may not work as expected</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Updates to This Cookie Policy</h2>
            <p className="text-base-content/70 mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Your Rights</h2>
            <p className="text-base-content/70 mb-4">
              Depending on your location, you may have certain rights regarding cookies and your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Right to Information:</strong> Know what cookies we use and why</li>
              <li><strong>Right to Consent:</strong> Give or withdraw consent for non-essential cookies</li>
              <li><strong>Right to Access:</strong> Request information about cookies stored on your device</li>
              <li><strong>Right to Deletion:</strong> Request deletion of cookies and associated data</li>
              <li><strong>Right to Portability:</strong> Receive your data in a structured format</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-base-content/70 mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Through our{" "}
                <Link href="/contact" className="link link-primary">
                  contact page
                </Link>
              </li>
              <li>By email at{" "}
                <a
                  href="mailto:privacy@ailaunchspace.com"
                  className="link link-primary"
                >
                  privacy@ailaunchspace.com
                </a>
              </li>
            </ul>
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

