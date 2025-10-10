import Link from "next/link";
import { Mail, Twitter } from "iconoir-react";

export const metadata = {
  title: "Contact Us - AI Launch Space",
  description: "Get in touch with the AI Launch Space team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-base-content/70">
            Have questions? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="card bg-base-200">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h2 className="card-title">Email Support</h2>
              </div>
              <p className="text-base-content/70 mb-4">
                For general inquiries, support, and partnership opportunities:
              </p>
              <a
                href="mailto:support@ailaunch.space"
                className="link link-primary font-medium"
              >
                support@ailaunch.space
              </a>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Twitter className="w-6 h-6 text-primary" />
                </div>
                <h2 className="card-title">Social Media</h2>
              </div>
              <p className="text-base-content/70 mb-4">
                Follow us for updates and reach out on Twitter:
              </p>
              <a
                href="https://twitter.com/ailaunchspace"
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary font-medium"
              >
                @ailaunchspace
              </a>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title mb-4">Frequently Asked Questions</h2>
            <p className="text-base-content/70 mb-4">
              Before reaching out, you might find your answer in our FAQ section:
            </p>
            <div className="card-actions">
              <Link href="/faq" className="btn btn-primary">
                Visit FAQ
              </Link>
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

