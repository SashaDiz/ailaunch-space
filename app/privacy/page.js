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
            <p className="text-sm text-base-content/60 mb-8">
              Last updated: October 2025
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-base-content/70 mb-4">
              At AI Launch Space ("we," "our," or "us"), we are committed to protecting your privacy and personal information. AI Launch Space is a discovery and launch platform connecting creators with early adopters. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
            </p>
            <p className="text-base-content/70 mb-4">
              By using our Platform, you consent to the data practices described in this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access or use the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3">2.1 Personal Information You Provide</h3>
            <p className="text-base-content/70 mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Account Information:</strong> Name, email address, profile picture, bio, website, social media handles</li>
              <li><strong>Project Information:</strong> Project names, descriptions, URLs, screenshots, videos, categories, pricing information</li>
              <li><strong>Payment Information:</strong> Billing details, transaction history (processed securely through Lemon Squeezy)</li>
              <li><strong>Communication Data:</strong> Messages, feedback, support requests</li>
              <li><strong>Newsletter Subscriptions:</strong> Email preferences and subscription status</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Information Collected Automatically</h3>
            <p className="text-base-content/70 mb-4">When you use our Platform, we automatically collect certain information:</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, votes, submissions</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Log Data:</strong> Access times, pages viewed, referring URLs, error logs</li>
              <li><strong>Analytics Data:</strong> User behavior patterns, performance metrics, engagement statistics</li>
              <li><strong>Cookies and Tracking Technologies:</strong> As described in our Cookie Policy</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.3 Information from Third Parties</h3>
            <p className="text-base-content/70 mb-4">We may receive information from third-party services:</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Authentication Providers:</strong> Supabase Auth for account creation and management</li>
              <li><strong>Payment Processors:</strong> Lemon Squeezy for transaction processing</li>
              <li><strong>Analytics Services:</strong> Rybbit analytics for website performance and user behavior data</li>
              <li><strong>Social Media Platforms:</strong> When you connect your social accounts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-base-content/70 mb-4">We use the information we collect for the following purposes:</p>
            
            <h3 className="text-xl font-semibold mb-3">3.1 Service Provision</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Provide, maintain, and improve our Platform and services</li>
              <li>Process and display your project submissions</li>
              <li>Enable voting and competition participation</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Process payments and manage premium subscriptions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 Communication</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Send you updates about your submissions and competitions</li>
              <li>Provide newsletters and marketing communications (with your consent)</li>
              <li>Notify you of important changes to our services or policies</li>
              <li>Respond to your comments, questions, and support requests</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Analytics and Improvement</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Analyze usage patterns and platform performance</li>
              <li>Improve user experience and platform functionality</li>
              <li>Develop new features and services</li>
              <li>Conduct research and analytics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.4 Legal and Security</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Comply with legal obligations and regulatory requirements</li>
              <li>Protect against fraud, abuse, and security threats</li>
              <li>Enforce our Terms of Service and other policies</li>
              <li>Protect our rights and the rights of our users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-base-content/70 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold mb-3">4.1 With Your Consent</h3>
            <p className="text-base-content/70 mb-4">
              We may share your information when you have given us explicit consent to do so.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.2 Service Providers</h3>
            <p className="text-base-content/70 mb-4">
              We may share information with trusted third-party service providers who assist us in operating our Platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Lemon Squeezy:</strong> Payment processing services</li>
              <li><strong>Email Services:</strong> Newsletter and communication delivery</li>
              <li><strong>Rybbit Analytics:</strong> Privacy-friendly website analytics and user behavior analysis</li>
              <li><strong>Cloud Hosting:</strong> Infrastructure and hosting services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.3 Legal Requirements</h3>
            <p className="text-base-content/70 mb-4">
              We may disclose your information if required to do so by law or in response to valid legal processes, such as subpoenas or court orders.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.4 Business Transfers</h3>
            <p className="text-base-content/70 mb-4">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.5 Public Information</h3>
            <p className="text-base-content/70 mb-4">
              Information you choose to make public on our Platform (such as project descriptions, names, and public profiles) will be visible to other users and may be indexed by search engines.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-base-content/70 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure hosting infrastructure</li>
              <li>Employee training on data protection practices</li>
            </ul>
            <p className="text-base-content/70 mb-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-base-content/70 mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. Specifically:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Account Information:</strong> Retained until you delete your account or request deletion</li>
              <li><strong>Project Submissions:</strong> Retained for the duration of your account plus additional time for analytics</li>
              <li><strong>Payment Information:</strong> Retained as required by applicable laws and regulations</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized data may be retained indefinitely</li>
              <li><strong>Communication Records:</strong> Retained for customer support and legal compliance purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-base-content/70 mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>

            <h3 className="text-xl font-semibold mb-3">7.1 General Rights</h3>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your data in a structured format</li>
              <li><strong>Restriction:</strong> Request restriction of processing of your information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.2 Marketing Communications</h3>
            <p className="text-base-content/70 mb-4">
              You can opt-out of marketing communications at any time by:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Clicking the unsubscribe link in our emails</li>
              <li>Updating your preferences in your account settings</li>
              <li>Contacting us directly</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.3 Cookie Preferences</h3>
            <p className="text-base-content/70 mb-4">
              You can manage your cookie preferences through your browser settings or our cookie consent banner. For more information, see our{" "}
              <Link href="/cookies" className="link link-primary">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
            <p className="text-base-content/70 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers are conducted in accordance with applicable data protection laws and that appropriate safeguards are in place to protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-base-content/70 mb-4">
              Our Platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us to have the information removed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Analytics and Tracking</h2>
            <p className="text-base-content/70 mb-4">
              We use Rybbit analytics to understand how visitors interact with our Platform. Rybbit is a privacy-friendly analytics service that helps us improve our website without compromising your privacy.
            </p>
            
            <h3 className="text-xl font-semibold mb-3">10.1 Rybbit Analytics</h3>
            <p className="text-base-content/70 mb-4">
              Rybbit analytics collects anonymous information about your visit to our Platform, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Pages visited and time spent on each page</li>
              <li>Referring websites and search terms</li>
              <li>Device type, browser, and operating system</li>
              <li>General geographic location (country/region level)</li>
              <li>Website performance metrics</li>
            </ul>
            
            <p className="text-base-content/70 mb-4">
              <strong>Privacy Features:</strong> Rybbit does not use cookies for tracking and is fully compliant with GDPR, CCPA, and other privacy regulations. No personal information is collected, and all data is anonymized and aggregated.
            </p>
            
            <p className="text-base-content/70 mb-4">
              For more information about Rybbit's privacy practices, please visit their{" "}
              <a href="https://www.rybbit.io/privacy" className="link link-primary" target="_blank" rel="noopener noreferrer">
                privacy policy
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Third-Party Links</h2>
            <p className="text-base-content/70 mb-4">
              Our Platform may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third parties. We encourage you to read the privacy policies of any third-party websites you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-base-content/70 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-base-content/70 mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
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

