import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site.config";
import { getAllPosts, type BlogPostMeta } from "@/lib/blog";

export const revalidate = 3600; // ISR: regenerate every hour

export async function generateMetadata() {
  return {
    title: `Blog – ${siteConfig.name}`,
    description:
      "Latest news, tips, and insights for AI tool builders, indie hackers, and founders.",
    openGraph: {
      title: `Blog – ${siteConfig.name}`,
      description:
        "Latest news, tips, and insights for AI tool builders, indie hackers, and founders.",
      type: "website",
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ArticleCard({ post }: { post: BlogPostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article
        className="bg-card border border-border rounded-[var(--radius)] overflow-hidden hover:-translate-y-1 transition duration-300 h-full flex flex-col"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        {post.image && (
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          {post.tags && post.tags.length > 0 && (
            <span className="inline-block self-start px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
              {post.tags[0]}
            </span>
          )}
          <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h2>
          {post.description && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {post.description}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground/70">
            <span>{formatDate(post.date)}</span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="container mx-auto px-4 py-12 max-w-6xl">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Latest news, tips, and insights for AI tool builders, indie hackers, and founders.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No posts yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
