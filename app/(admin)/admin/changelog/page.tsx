import Link from "next/link";

export default function AdminChangelogPage() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold mb-4">Admin Changelog</h1>
      <p className="text-lg text-muted-foreground mb-8">
        The changelog management feature is currently disabled and will be available in a future update.
      </p>
      <Link href="/admin" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)]">
        Back to Dashboard
      </Link>
    </div>
  );
}
