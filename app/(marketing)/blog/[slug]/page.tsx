import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { getPostBySlug, listBlogSlugs } from "@/lib/blog";

export const revalidate = 3600; // ISR: regenerate every hour

export async function generateStaticParams() {
  const slugs = await listBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: `Not found – ${siteConfig.name}` };
  return {
    title: `${post.title} – ${siteConfig.name}`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      images: post.image ? [post.image] : undefined,
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <nav className="mb-8">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to blog
        </Link>
      </nav>

      <article>
        <header className="mb-8">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{post.title}</h1>
          {post.description && (
            <p className="text-lg text-muted-foreground mb-4">{post.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {post.author && <span>{post.author}</span>}
            <span>{formatDate(post.date)}</span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>
        </header>

        {post.image && (
          <div className="aspect-video relative overflow-hidden rounded-[var(--radius)] mb-8">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </main>
  );
}
