/**
 * Static markdown-backed blog.
 *
 * Posts live as `content/blog/*.md` with frontmatter:
 *   ---
 *   title: "Post title"
 *   description: "Short summary for cards and meta description"
 *   date: 2026-01-15
 *   author: "Sasha"
 *   image: "/assets/blog/cover.png"   # optional
 *   tags: ["ai", "directory"]          # optional
 *   draft: false                       # optional, true = hidden from list
 *   ---
 *
 * Rendered at build time (revalidate = 1 hour, cheap to regenerate).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { db } from "@/lib/supabase/database";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  author?: string;
  image?: string;
  tags?: string[];
  draft?: boolean;
  readingTimeMinutes: number;
}

export interface BlogPost extends BlogPostMeta {
  contentHtml: string;
  contentRaw: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function calculateReadingTime(markdown: string): number {
  const wordsPerMinute = 220;
  const words = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*_>\-\[\]\(\)`]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

async function readPostFile(slug: string): Promise<BlogPost | null> {
  const fullPath = path.join(BLOG_DIR, `${slug}.md`);
  let raw: string;
  try {
    raw = await fs.readFile(fullPath, "utf8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  if (!data.title || !data.date) {
    console.warn(`Blog post ${slug} is missing title or date in frontmatter`);
    return null;
  }
  const dateIso = new Date(data.date).toISOString();
  const html = await marked.parse(content, { async: true });
  return {
    slug,
    title: String(data.title),
    description: String(data.description ?? ""),
    date: dateIso,
    author: data.author ? String(data.author) : undefined,
    image: data.image ? String(data.image) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    draft: Boolean(data.draft),
    readingTimeMinutes: calculateReadingTime(content),
    contentHtml: html,
    contentRaw: content,
  };
}

/**
 * Admin-authored posts live in the `blog_posts` table (managed under
 * /admin/blog). They are merged into the public feed below alongside the
 * markdown files. A DB post is "live" when published, or scheduled with a
 * publish time that has passed. Its `content` is already sanitized HTML
 * (produced by the Tiptap editor), so it maps straight to `contentHtml`.
 */
function isDbPostLive(row: any): boolean {
  if (!row) return false;
  if (row.status === "published") return true;
  if (row.status === "scheduled" && row.published_at) {
    return new Date(row.published_at).getTime() <= Date.now();
  }
  return false;
}

function dbRowToPost(row: any): BlogPost {
  const html = String(row.content || "");
  const dateIso =
    row.published_at || row.created_at || new Date().toISOString();
  return {
    slug: row.slug,
    title: String(row.title || ""),
    description: String(row.excerpt || ""),
    date: new Date(dateIso).toISOString(),
    author: undefined,
    image: row.featured_image || undefined,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : undefined,
    draft: false,
    readingTimeMinutes: row.reading_time || calculateReadingTime(html),
    contentHtml: html,
    contentRaw: html,
  };
}

/** All live admin-authored posts, newest-first. Returns [] on any failure. */
async function getDbPosts(): Promise<BlogPost[]> {
  try {
    const rows = await db.find(
      "blog_posts",
      { status: { $in: ["published", "scheduled"] } },
      { sort: { published_at: -1 }, limit: 500 }
    );
    return (rows as any[]).filter(isDbPostLive).map(dbRowToPost);
  } catch (error) {
    console.error("Failed to fetch DB blog posts:", error);
    return [];
  }
}

/** Slugs of the markdown files only (used internally to build the feed). */
async function listMarkdownSlugs(): Promise<string[]> {
  let files: string[] = [];
  try {
    files = await fs.readdir(BLOG_DIR);
  } catch {
    return [];
  }
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** All public blog slugs (markdown + live DB posts) — used for static params. */
export async function listBlogSlugs(): Promise<string[]> {
  const [mdSlugs, dbPosts] = await Promise.all([
    listMarkdownSlugs(),
    getDbPosts(),
  ]);
  // DB posts win on slug conflicts (admin-authored override).
  return Array.from(new Set([...dbPosts.map((p) => p.slug), ...mdSlugs]));
}

export async function getAllPosts(options: { includeDrafts?: boolean } = {}): Promise<BlogPostMeta[]> {
  const [mdSlugs, dbPosts] = await Promise.all([
    listMarkdownSlugs(),
    getDbPosts(),
  ]);
  const mdPosts = (await Promise.all(mdSlugs.map((s) => readPostFile(s))))
    .filter((p): p is BlogPost => p !== null)
    .filter((p) => options.includeDrafts || !p.draft);

  // Merge DB + markdown, DB winning on slug conflicts, newest-first.
  const bySlug = new Map<string, BlogPost>();
  for (const p of mdPosts) bySlug.set(p.slug, p);
  for (const p of dbPosts) bySlug.set(p.slug, p);

  return Array.from(bySlug.values())
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ contentHtml: _h, contentRaw: _r, ...meta }) => meta);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  // DB-authored posts take priority over a markdown file with the same slug.
  try {
    const row = await db.findOne("blog_posts", { slug });
    if (row && isDbPostLive(row)) return dbRowToPost(row);
  } catch (error) {
    console.error("Failed to fetch DB blog post:", error);
  }

  const post = await readPostFile(slug);
  if (!post || post.draft) return null;
  return post;
}
