import Link from "next/link";

export const metadata = {
  title: "Blog - AI Launch Space",
  description: "Latest news, tips, and insights for AI builders and makers.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-lg text-base-content/70 mb-8">
            Coming soon! Stay tuned for the latest news, tips, and insights for AI builders.
          </p>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

