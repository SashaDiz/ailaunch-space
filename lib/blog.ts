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

export async function listBlogSlugs(): Promise<string[]> {
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

export async function getAllPosts(options: { includeDrafts?: boolean } = {}): Promise<BlogPostMeta[]> {
  const slugs = await listBlogSlugs();
  const posts = await Promise.all(slugs.map((s) => readPostFile(s)));
  return posts
    .filter((p): p is BlogPost => p !== null)
    .filter((p) => options.includeDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ contentHtml: _h, contentRaw: _r, ...meta }) => meta);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const post = await readPostFile(slug);
  if (!post || post.draft) return null;
  return post;
}
