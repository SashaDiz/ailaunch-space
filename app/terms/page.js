import Link from "next/link";

export const metadata = {
  title: "Terms of Service - AI Launch Space",
  description: "Terms and conditions for using AI Launch Space platform and services.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose max-w-none">
          <section className="mb-8">
            <p className="text-sm text-base-content/60 mb-8">
              Last updated: October 2025
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Legal Entity</h2>
            <p className="text-base-content/70 mb-4">
              AI Launch Space is operated by Aleksandr Borisov, an individual entrepreneur registered in Georgia (Registration No. 011-90274).
            </p>

            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-base-content/70 mb-4">
              By accessing and using AI Launch Space ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-base-content/70 mb-4">
              AI Launch Space is a discovery and launch platform connecting creators with early adopters. Inspired by Product Hunt and Uneed.best, it features a curated directory where entrepreneurs, developers, and makers showcase digital products, SaaS tools, and creative projects. Our services include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Project submission and listing services</li>
              <li>Weekly competitions and voting systems</li>
              <li>Premium submission services with enhanced features</li>
              <li>Community exposure and feedback systems</li>
              <li>Newsletter and communication services</li>
              <li>Analytics and performance tracking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>
            <p className="text-base-content/70 mb-4">
              To access certain features of the Platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information to keep it accurate</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Project Submissions</h2>
            <h3 className="text-xl font-semibold mb-3">4.1 Submission Requirements</h3>
            <p className="text-base-content/70 mb-4">
              When submitting projects to our Platform, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Own or have proper authorization to submit the project</li>
              <li>Provide accurate and complete project information</li>
              <li>Ensure the project is functional and accessible</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not submit projects that infringe on intellectual property rights</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.2 Submission Plans</h3>
            <p className="text-base-content/70 mb-4">
              We offer two submission plans:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Standard Plan (Free):</strong> Basic project listing with community voting eligibility</li>
              <li><strong>Premium Plan ($15):</strong> Enhanced features including priority placement, extended homepage exposure, premium badge, and enhanced social media promotion</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.3 Content Moderation</h3>
            <p className="text-base-content/70 mb-4">
              We reserve the right to review, approve, reject, or remove any project submission at our sole discretion. Projects may be rejected for reasons including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Inappropriate or harmful content</li>
              <li>Violation of intellectual property rights</li>
              <li>Misleading or false information</li>
              <li>Non-functional or broken links</li>
              <li>Violation of our community guidelines</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
            <h3 className="text-xl font-semibold mb-3">5.1 Premium Services</h3>
            <p className="text-base-content/70 mb-4">
              Premium plan submissions require payment of $15 USD before processing. Payment is processed securely through our payment processor.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.2 Refund Policy</h3>
            <p className="text-base-content/70 mb-4">
              We offer refunds for premium services under the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li><strong>Technical Issues:</strong> If we are unable to deliver the promised premium services due to technical problems on our end</li>
              <li><strong>Service Non-Delivery:</strong> If your premium submission is not processed or published within 48 hours of the scheduled launch date (for immediate launches) or within 48 hours of the scheduled date (for future launches)</li>
              <li><strong>Duplicate Payment:</strong> If you are accidentally charged multiple times for the same service</li>
              <li><strong>Service Cancellation:</strong> If you request cancellation before your submission is processed and published on the scheduled launch date</li>
            </ul>
            <p className="text-base-content/70 mb-4">
              <strong>Refund Exclusions:</strong> We do not provide refunds for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Change of mind after service delivery</li>
              <li>Dissatisfaction with voting results or community response</li>
              <li>Project rejection due to content policy violations</li>
              <li>Technical issues on your end (broken links, inaccessible websites, etc.)</li>
              <li>Requests made more than 7 days after payment</li>
              <li>Change of mind about scheduled launch dates (you can reschedule but not get a refund)</li>
            </ul>
            <p className="text-base-content/70 mb-4">
              <strong>Refund Process:</strong> To request a refund, contact us at{" "}
              <a href="mailto:support@ailaunchspace.com" className="link link-primary">
                support@ailaunchspace.com
              </a>
              {" "}with your payment details and reason for the refund request. Refunds will be processed within 5-10 business days and returned to your original payment method.
            </p>

            <h3 className="text-xl font-semibold mb-3">5.3 Payment Processing</h3>
            <p className="text-base-content/70 mb-4">
              By making a payment, you authorize us to charge the specified amount to your chosen payment method. You are responsible for any applicable taxes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property Rights</h2>
            <h3 className="text-xl font-semibold mb-3">6.1 Your Content</h3>
            <p className="text-base-content/70 mb-4">
              You retain ownership of all intellectual property rights in your project submissions. By submitting content to our Platform, you grant us a non-exclusive, royalty-free license to display, distribute, and promote your content as part of our services.
            </p>

            <h3 className="text-xl font-semibold mb-3">6.2 Platform Content</h3>
            <p className="text-base-content/70 mb-4">
              The Platform and its original content, features, and functionality are owned by AI Launch Space and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
            <p className="text-base-content/70 mb-4">
              You may not use our Platform:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
              <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              <li>For any obscene or immoral purpose</li>
              <li>To interfere with or circumvent the security features of the Platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
            <p className="text-base-content/70 mb-4">
              Your privacy is important to us. Please review our{" "}
              <Link href="/privacy" className="link link-primary">
                Privacy Policy
              </Link>
              , which also governs your use of the Platform, to understand our practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitations of Liability</h2>
            <h3 className="text-xl font-semibold mb-3">9.1 Service Availability</h3>
            <p className="text-base-content/70 mb-4">
              We do not guarantee that our Platform will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Platform.
            </p>

            <h3 className="text-xl font-semibold mb-3">9.2 Third-Party Content</h3>
            <p className="text-base-content/70 mb-4">
              The Platform may contain links to third-party websites or services that are not owned or controlled by AI Launch Space. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
            </p>

            <h3 className="text-xl font-semibold mb-3">9.3 Limitation of Liability</h3>
            <p className="text-base-content/70 mb-4">
              In no event shall AI Launch Space, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-base-content/70 mb-4">
              We may terminate or suspend your account and bar access to the Platform immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
            <p className="text-base-content/70 mb-4">
              These Terms shall be interpreted and governed by the laws of the United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-base-content/70 mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p className="text-base-content/70">
              If you have any questions about these Terms of Service, please contact us through our{" "}
              <Link href="/contact" className="link link-primary">
                contact page
              </Link>
              {" "}or email us at{" "}
              <a
                href="mailto:hello@ailaunchspace.com"
                className="link link-primary"
              >
                hello@ailaunchspace.com
              </a>
              .
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
