import Link from "next/link";

export const metadata = {
  title: "Changelog - AI Launch Space",
  description: "See what's new and improved on AI Launch Space.",
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-lg text-base-content/70">
            Track all updates, improvements, and new features
          </p>
        </div>

        <div className="space-y-8">
          <div className="card bg-base-200">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title">Version 1.0.0</h2>
                <span className="badge badge-primary">Latest</span>
              </div>
              <p className="text-sm text-base-content/60 mb-4">October 2025</p>
              <ul className="list-disc list-inside space-y-2 text-base-content/70">
                <li>🚀 Initial platform launch</li>
                <li>✨ Weekly AI project competitions</li>
                <li>💎 Premium and Standard launch plans</li>
                <li>🏆 Top 3 winners get dofollow backlinks</li>
                <li>📊 Real-time voting and leaderboards</li>
              </ul>
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

