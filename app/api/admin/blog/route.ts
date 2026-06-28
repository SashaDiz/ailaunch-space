import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { checkIsAdmin } from "@/lib/supabase/auth";
import { db } from "@/lib/supabase/database";
import { featureGuard } from "@/lib/features";
import { validation } from "@/lib/rate-limit";
import { calculateReadingTime, slugifyTitle } from "@/lib/blog-utils";

async function checkAdminAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  const hasCronSecret = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (hasCronSecret) return { session: { user: { id: "cron" } } };

  const cookieStore = await cookies();
  const supabase = createServerClient(
    getSupabaseUrl()!,
    getSupabasePublishableKey()!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  return { session: { user } };
}

const STATUSES = ["draft", "scheduled", "published"];

/** Build a slug unique across blog_posts (skips a row being edited). */
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugifyTitle(base);
  let slug = root;
  let n = 1;
  // Loop until no other row owns the slug.
  // (Manual posts are few; a handful of round-trips at worst.)
  while (true) {
    const existing = await db.findOne("blog_posts", { slug });
    if (!existing || (ignoreId && existing.id === ignoreId)) return slug;
    slug = `${root}-${++n}`;
  }
}

/** Normalize tags into a clean string array. */
function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => validation.sanitizeString(String(t), 50))
    .filter(Boolean)
    .slice(0, 20);
}

/**
 * Purge the ISR cache for the blog index and the given post slug(s) so
 * published changes go live immediately instead of waiting for revalidate.
 */
function revalidateBlog(...slugs: (string | undefined | null)[]) {
  revalidatePath("/blog");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/blog/${slug}`);
  }
}

// GET /api/admin/blog — paginated list (all statuses), with search + status filter
export async function GET(request: Request) {
  const guard = featureGuard("blog");
  if (guard) return guard;

  try {
    const authCheck = await checkAdminAuth(request);
    if ("error" in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.trim();

    const query: Record<string, any> = {};
    if (status && STATUSES.includes(status)) query.status = status;
    if (search) query.title = { $regex: search };

    const [posts, total] = await Promise.all([
      db.find("blog_posts", query, {
        sort: { created_at: -1 },
        skip: (page - 1) * limit,
        limit,
      }),
      db.count("blog_posts", query),
    ]);

    return NextResponse.json({
      success: true,
      data: { posts, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}

// POST /api/admin/blog — create (or ?action=duplicate&id=… to clone)
export async function POST(request: Request) {
  const guard = featureGuard("blog");
  if (guard) return guard;

  try {
    const authCheck = await checkAdminAuth(request);
    if ("error" in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // ── Duplicate ────────────────────────────────────────────────────────────
    if (action === "duplicate") {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

      const source = await db.findOne("blog_posts", { id });
      if (!source) return NextResponse.json({ error: "Post not found" }, { status: 404 });

      const slug = await uniqueSlug(`${source.slug}-copy`);
      const result = await db.insertOne("blog_posts", {
        slug,
        title: `${source.title} (Copy)`,
        excerpt: source.excerpt || null,
        content: source.content || "",
        featured_image: source.featured_image || null,
        category: source.category || null,
        tags: source.tags || [],
        status: "draft",
        published_at: null,
        reading_time: source.reading_time || 1,
        meta_keywords: source.meta_keywords || null,
        author_id: (authCheck as any).session?.user?.id ?? null,
      });
      return NextResponse.json({ success: true, data: { id: result.insertedId, slug } });
    }

    // ── Create ─────────────────────────────────────────────────────────────────
    const body = await request.json();

    const title = validation.sanitizeString(body.title || "", 200);
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const status = STATUSES.includes(body.status) ? body.status : "draft";
    const content = typeof body.content === "string" ? body.content : "";
    const slug = await uniqueSlug(body.slug || title);

    const result = await db.insertOne("blog_posts", {
      slug,
      title,
      excerpt: body.excerpt ? validation.sanitizeString(body.excerpt, 300) : null,
      content,
      featured_image: body.featured_image || null,
      category: body.category ? validation.sanitizeString(body.category, 100) : null,
      tags: cleanTags(body.tags),
      status,
      published_at: status === "draft" ? null : body.published_at || new Date().toISOString(),
      reading_time: calculateReadingTime(content),
      meta_keywords: body.meta_keywords ? validation.sanitizeString(body.meta_keywords, 300) : null,
      author_id: (authCheck as any).session?.user?.id ?? null,
    });

    revalidateBlog(slug);
    return NextResponse.json({ success: true, data: { id: result.insertedId, slug } });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}

// PUT /api/admin/blog?id=… — update
export async function PUT(request: Request) {
  const guard = featureGuard("blog");
  if (guard) return guard;

  try {
    const authCheck = await checkAdminAuth(request);
    if ("error" in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

    const existing = await db.findOne("blog_posts", { id });
    if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.title !== undefined) updateData.title = validation.sanitizeString(body.title, 200);
    if (body.excerpt !== undefined)
      updateData.excerpt = body.excerpt ? validation.sanitizeString(body.excerpt, 300) : null;
    if (body.featured_image !== undefined) updateData.featured_image = body.featured_image || null;
    if (body.category !== undefined)
      updateData.category = body.category ? validation.sanitizeString(body.category, 100) : null;
    if (body.tags !== undefined) updateData.tags = cleanTags(body.tags);
    if (body.meta_keywords !== undefined)
      updateData.meta_keywords = body.meta_keywords
        ? validation.sanitizeString(body.meta_keywords, 300)
        : null;

    if (body.content !== undefined) {
      updateData.content = typeof body.content === "string" ? body.content : "";
      updateData.reading_time = calculateReadingTime(updateData.content);
    }

    if (body.status !== undefined && STATUSES.includes(body.status)) {
      updateData.status = body.status;
      if (body.status === "draft") {
        updateData.published_at = null;
      } else if (body.published_at !== undefined) {
        updateData.published_at = body.published_at || new Date().toISOString();
      } else if (!existing.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    } else if (body.published_at !== undefined) {
      updateData.published_at = body.published_at || null;
    }

    if (body.slug !== undefined && body.slug && body.slug !== existing.slug) {
      updateData.slug = await uniqueSlug(body.slug, id);
    }

    await db.updateOne("blog_posts", { id }, { $set: updateData });
    // Revalidate the old slug and (if renamed) the new one, plus the index.
    revalidateBlog(existing.slug, updateData.slug);
    return NextResponse.json({ success: true, message: "Post updated" });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

// DELETE /api/admin/blog?id=… (single) or body { ids: [...] } (bulk)
export async function DELETE(request: Request) {
  const guard = featureGuard("blog");
  if (guard) return guard;

  try {
    const authCheck = await checkAdminAuth(request);
    if ("error" in authCheck) return authCheck.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    let ids: string[] = [];
    if (id) {
      ids = [id];
    } else {
      const body = await request.json().catch(() => ({}));
      if (Array.isArray(body.ids)) ids = body.ids.filter((x: unknown) => typeof x === "string");
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: "Post ID(s) required" }, { status: 400 });
    }

    // Capture slugs before deletion so we can purge their cached pages.
    const rows = await db.find(
      "blog_posts",
      { id: { $in: ids } },
      { projection: { slug: 1 } }
    );
    const slugs = (rows as { slug: string }[]).map((r) => r.slug);

    await db.deleteMany("blog_posts", { id: { $in: ids } });
    revalidateBlog(...slugs);
    return NextResponse.json({ success: true, data: { deleted: ids.length } });
  } catch (error) {
    console.error("Error deleting blog post(s):", error);
    return NextResponse.json({ error: "Failed to delete blog post(s)" }, { status: 500 });
  }
}
