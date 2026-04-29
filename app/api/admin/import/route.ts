import { NextResponse } from "next/server";
import { getSession } from "@/lib/supabase/auth";
import { isAdmin } from "@/lib/supabase/auth-helpers";
import { db } from "@/lib/supabase/database";

const MAX_ROWS = 500;

const VALID_PRICING = ["Free", "Freemium", "Paid"];
const VALID_PLANS = ["standard", "premium"];
const VALID_STATUSES = ["pending", "approved", "rejected", "live", "archived", "scheduled", "draft"];
const VALID_LINK_TYPES = ["nofollow", "dofollow"];

async function checkAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const admin = await isAdmin();
  if (!admin) return null;
  return session;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitize(str: string): string {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:/gi, "");
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseArrayField(value: string | undefined): string[] {
  if (!value || !value.trim()) return [];
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

function mapPricing(raw: string): string {
  if (!raw) return "Free";
  if (VALID_PRICING.includes(raw)) return raw;
  const lower = raw.toLowerCase();

  // Detect freemium: mentions both free and paid aspects
  if (
    lower.includes("freemium") ||
    (lower.includes("free") && (lower.includes("paid") || lower.includes("$") || lower.includes("plan") || lower.includes("pro") || lower.includes("premium") || lower.includes("tier")))
  ) {
    return "Freemium";
  }

  // Detect free only
  if (lower.includes("free") || lower.includes("open source") || lower.includes("no cost")) {
    return "Free";
  }

  // Detect paid
  if (
    lower.includes("paid") || lower.includes("$") || lower.includes("subscription") ||
    lower.includes("per month") || lower.includes("/mo") || lower.includes("pricing") ||
    lower.includes("enterprise") || lower.includes("per user") || lower.includes("per seat") ||
    lower.includes("usage-based") || lower.includes("custom")
  ) {
    return "Paid";
  }

  return "Free";
}

function mapPlan(raw: string): string {
  if (!raw) return "standard";
  if (VALID_PLANS.includes(raw)) return raw;
  return raw.toLowerCase() === "premium" ? "premium" : "standard";
}

function mapStatus(raw: string): string {
  if (!raw) return "live";
  if (VALID_STATUSES.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  const statusMap: Record<string, string> = {
    active: "live",
    published: "live",
    enabled: "live",
    inactive: "archived",
    disabled: "archived",
    hidden: "archived",
    waiting: "pending",
    review: "pending",
    declined: "rejected",
    denied: "rejected",
  };
  return statusMap[lower] || "live";
}

function mapLinkType(raw: string): string {
  if (!raw) return "nofollow";
  if (VALID_LINK_TYPES.includes(raw)) return raw;
  return raw.toLowerCase() === "dofollow" ? "dofollow" : "nofollow";
}

interface CsvRow {
  name?: string;
  website_url?: string;
  slug?: string;
  short_description?: string;
  full_description?: string;
  categories?: string;
  pricing?: string;
  tags?: string;
  logo_url?: string;
  plan?: string;
  status?: string;
  link_type?: string;
  contact_email?: string;
  meta_title?: string;
  meta_description?: string;
}

interface ValidationResult {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  data: Record<string, any> | null;
}

function validateRow(row: CsvRow, rowIndex: number, slugsInBatch: Set<string>, existingSlugs: Set<string>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = sanitize((row.name || "").trim());
  if (!name) {
    errors.push("Name is required");
  }

  const websiteUrl = (row.website_url || "").trim();
  if (!websiteUrl) {
    errors.push("Website URL is required");
  } else if (!isValidUrl(websiteUrl)) {
    errors.push("Invalid website URL (must start with http:// or https://)");
  }

  // Auto-deduplicate slugs instead of rejecting
  let slug = (row.slug || "").trim() ? sanitize((row.slug || "").trim()) : name ? generateSlug(name) : "";
  if (slug) {
    const baseSlug = slug;
    let suffix = 2;
    while (slugsInBatch.has(slug) || existingSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    if (slug !== baseSlug) {
      warnings.push(`slug: "${baseSlug}" → "${slug}" (deduplicated)`);
    }
    slugsInBatch.add(slug);
  }

  const categories = parseArrayField(row.categories);
  if (categories.length > 3) {
    errors.push("Maximum 3 categories allowed");
  }

  // Smart mapping instead of strict validation
  const pricingRaw = (row.pricing || "").trim();
  const pricing = mapPricing(pricingRaw);
  if (pricingRaw && pricingRaw !== pricing) {
    warnings.push(`pricing: "${pricingRaw}" → "${pricing}"`);
  }

  const planRaw = (row.plan || "").trim();
  const plan = mapPlan(planRaw);
  if (planRaw && planRaw !== plan) {
    warnings.push(`plan: "${planRaw}" → "${plan}"`);
  }

  const statusRaw = (row.status || "").trim();
  const status = mapStatus(statusRaw);
  if (statusRaw && statusRaw !== status) {
    warnings.push(`status: "${statusRaw}" → "${status}"`);
  }

  const linkTypeRaw = (row.link_type || "").trim();
  const linkType = mapLinkType(linkTypeRaw);
  if (linkTypeRaw && linkTypeRaw !== linkType) {
    warnings.push(`link_type: "${linkTypeRaw}" → "${linkType}"`);
  }

  const logoUrl = (row.logo_url || "").trim();
  if (logoUrl && !isValidUrl(logoUrl)) {
    errors.push("Invalid logo_url format");
  }

  const shortDesc = sanitize((row.short_description || "").trim());
  if (shortDesc.length > 200) {
    errors.push("short_description exceeds 200 characters");
  }

  const fullDesc = sanitize((row.full_description || "").trim());
  if (fullDesc.length > 3000) {
    errors.push("full_description exceeds 3000 characters");
  }

  // Auto-truncate meta fields instead of rejecting
  const metaTitleRaw = sanitize((row.meta_title || "").trim());
  const metaTitle = truncateWithEllipsis(metaTitleRaw, 60);
  if (metaTitleRaw.length > 60) {
    warnings.push(`meta_title truncated from ${metaTitleRaw.length} to 60 chars`);
  }

  const metaDescRaw = sanitize((row.meta_description || "").trim());
  const metaDesc = truncateWithEllipsis(metaDescRaw, 160);
  if (metaDescRaw.length > 160) {
    warnings.push(`meta_description truncated from ${metaDescRaw.length} to 160 chars`);
  }

  if (errors.length > 0) {
    return { rowIndex, valid: false, errors, warnings, data: null };
  }

  return {
    rowIndex,
    valid: true,
    errors: [],
    warnings,
    data: {
      name,
      slug,
      website_url: websiteUrl,
      short_description: shortDesc,
      full_description: fullDesc,
      categories,
      pricing,
      logo_url: logoUrl,
      tags: parseArrayField(row.tags),
      link_type: linkType,
      dofollow_status: linkType === "dofollow",
      plan,
      status,
      approved: true,
      featured: false,
      premium_badge: plan === "premium",
      meta_title: metaTitle,
      meta_description: metaDesc,
      contact_email: (row.contact_email || "").trim(),
    },
  };
}

async function handleValidate(rows: CsvRow[]) {
  // Collect all potential slugs for batch DB lookup
  const potentialSlugs = rows.map((row) => {
    const slug = (row.slug || "").trim();
    if (slug) return sanitize(slug);
    const name = (row.name || "").trim();
    if (name) return generateSlug(name);
    return "";
  }).filter(Boolean);

  // Single batch query to check existing slugs
  let existingSlugs = new Set<string>();
  if (potentialSlugs.length > 0) {
    try {
      const existingApps = await db.find(
        "apps",
        { slug: { $in: potentialSlugs } },
        { projection: { slug: 1 }, limit: potentialSlugs.length }
      );
      existingSlugs = new Set(existingApps.map((a: any) => a.slug));
    } catch (error) {
      console.error("Error checking existing slugs:", error);
    }
  }

  // Collect all categories from CSV and check which are new
  const allCsvCategories = new Set<string>();
  for (const row of rows) {
    const cats = parseArrayField(row.categories);
    cats.forEach((c) => allCsvCategories.add(c));
  }

  const existingCategories = new Map<string, string>();
  if (allCsvCategories.size > 0) {
    try {
      const dbCategories = await db.find("categories", {}, {
        projection: { name: 1, slug: 1 },
        limit: 1000,
      });
      for (const cat of dbCategories as any[]) {
        existingCategories.set(cat.name.toLowerCase(), cat.name);
        existingCategories.set(cat.slug.toLowerCase(), cat.name);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  const newCategories: string[] = [];
  for (const catName of allCsvCategories) {
    if (!existingCategories.has(catName.toLowerCase())) {
      newCategories.push(catName);
    }
  }

  const slugsInBatch = new Set<string>();
  const results: ValidationResult[] = rows.map((row, i) =>
    validateRow(row, i, slugsInBatch, existingSlugs)
  );

  const valid = results.filter((r) => r.valid).length;
  const errorsCount = results.filter((r) => !r.valid).length;
  const duplicates = results.filter((r) =>
    r.errors.some((e) => e.includes("Duplicate slug") || e.includes("already exists"))
  ).length;
  const warningsCount = results.filter((r) => r.warnings && r.warnings.length > 0).length;

  return {
    summary: { total: rows.length, valid, errors: errorsCount, duplicates, warnings: warningsCount, newCategories },
    rows: results,
  };
}

async function handleExecute(rows: Record<string, any>[], sessionUserId: string, sessionEmail: string, newCategories: string[] = []) {
  const results: { inserted: number; failed: number; categoriesCreated: number; errors: { row: number; error: string }[] } = {
    inserted: 0,
    failed: 0,
    categoriesCreated: 0,
    errors: [],
  };

  // Create missing categories first
  for (const catName of newCategories) {
    try {
      const slug = generateSlug(catName);
      const existing = await db.findOne("categories", {
        $or: [{ slug }, { name: catName }],
      });
      if (!existing) {
        await db.insertOne("categories", {
          name: catName,
          slug,
          description: "",
          color: "#6366f1",
          icon: "",
          css_class: `category-${slug}`,
          sort_order: 999,
          app_count: 0,
          featured: false,
          sphere: "Other",
        });
        results.categoriesCreated++;
      }
    } catch (error: any) {
      console.error(`Failed to create category "${catName}":`, error);
    }
  }

  // Insert projects
  for (let i = 0; i < rows.length; i++) {
    const { _rowIndex, ...rowData } = rows[i];
    try {
      const projectData = {
        ...rowData,
        contact_email: rowData.contact_email || sessionEmail || "",
        submitted_by: sessionUserId,
        payment_status: true,
        is_draft: false,
        screenshots: [],
        video_url: "",
        views: 0,
        upvotes: 0,
        clicks: 0,
      };

      await db.insertOne("apps", projectData);
      results.inserted++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        row: _rowIndex ?? i,
        error: error.message || "Insert failed",
      });
    }
  }

  return results;
}

export async function POST(request: Request) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action !== "validate" && action !== "execute") {
      return NextResponse.json(
        { error: "Invalid action. Use ?action=validate or ?action=execute" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No rows provided" },
        { status: 400 }
      );
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ROWS} rows allowed per import` },
        { status: 400 }
      );
    }

    if (action === "validate") {
      const result = await handleValidate(rows);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "execute") {
      const result = await handleExecute(
        rows,
        session.user.id,
        session.user.email || "",
        body.newCategories || []
      );
      return NextResponse.json({ success: true, results: result });
    }
  } catch (error: any) {
    console.error("Admin import error:", error);
    return NextResponse.json(
      { error: "Import failed: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
