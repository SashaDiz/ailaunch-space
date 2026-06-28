/**
 * Pure helpers for the admin blog editor (the `blog_posts` table). Kept separate
 * from `lib/blog.ts` (the markdown-file public blog) to avoid coupling the admin
 * CRUD to the public rendering layer.
 */

/** Word-count read-time estimate (200 wpm) from HTML. Min 1 min. */
export function calculateReadingTime(html: string): number {
  const text = String(html || "").replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Slugify a title for URL use. */
export function slugifyTitle(title: string): string {
  return (
    String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "post"
  );
}
