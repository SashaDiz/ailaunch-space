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
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies</h2>
            <p className="text-base-content/70 mb-4">
              Cookies are small text files that are placed on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="text-base-content/70 mb-4">We use cookies to:</p>
            <ul className="list-disc list-inside space-y-2 text-base-content/70 mb-4">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Understand how you use our platform</li>
              <li>Improve our services and user experience</li>
              <li>Provide security features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
                <p className="text-base-content/70">
                  These cookies are necessary for the website to function properly. They enable 
                  core functionality such as security, authentication, and accessibility.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Analytics Cookies</h3>
                <p className="text-base-content/70">
                  These cookies help us understand how visitors interact with our website by 
                  collecting and reporting information anonymously.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
            <p className="text-base-content/70 mb-4">
              You can control and manage cookies in your browser settings. Please note that 
              removing or blocking cookies may impact your user experience and some features 
              may not function properly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-base-content/70">
              If you have any questions about our use of cookies, please contact us through our{" "}
              <Link href="/contact" className="link link-primary">
                contact page
              </Link>
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

