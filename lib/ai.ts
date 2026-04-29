import { isEnabled } from '@/lib/features';
import { aiConfig } from '@/config/ai.config';

class AIDisabledError extends Error {
  constructor() {
    super('AI feature is not enabled. Set ai: true in config/features.config.ts and provide AI_API_KEY.');
    this.name = 'AIDisabledError';
  }
}

/**
 * Ensure the AI feature is enabled and an API key is configured.
 * Throws a descriptive error if not.
 */
function ensureAIAvailable(): void {
  if (!isEnabled('ai')) {
    throw new AIDisabledError();
  }
  if (!aiConfig.apiKey) {
    throw new Error('AI_API_KEY environment variable is not set.');
  }
}

/**
 * Dynamically load the AI SDK model based on config.
 * Uses dynamic imports to avoid issues if packages are missing.
 */
async function getModel() {
  try {
    if (aiConfig.provider === 'anthropic') {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      return createAnthropic({ apiKey: aiConfig.apiKey })(aiConfig.model);
    }
    const { createOpenAI } = await import('@ai-sdk/openai');
    return createOpenAI({ apiKey: aiConfig.apiKey })(aiConfig.model);
  } catch (error) {
    throw new Error(
      `Failed to load AI SDK for provider "${aiConfig.provider}". ` +
      `Ensure the required package (@ai-sdk/${aiConfig.provider}) is installed. ` +
      `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function generateDescription(
  name: string,
  shortDesc: string,
  category: string,
): Promise<string> {
  ensureAIAvailable();

  const { generateText } = await import('ai');
  const model = await getModel();

  const { text } = await generateText({
    model,
    maxOutputTokens: aiConfig.maxTokens,
    temperature: aiConfig.temperature,
    prompt: `Write a compelling, professional product description for a project called "${name}".
Short description: "${shortDesc}"
Category: "${category}"

Requirements:
- 150-300 words
- Professional but engaging tone
- Highlight key benefits and use cases
- Do not use marketing buzzwords excessively
- Return only the description text, no headers or formatting`,
  });
  return text;
}

export async function suggestCategories(
  name: string,
  description: string,
  availableCategories: string[],
): Promise<string[]> {
  ensureAIAvailable();

  const { generateText } = await import('ai');
  const model = await getModel();

  const { text } = await generateText({
    model,
    maxOutputTokens: 200,
    temperature: 0.3,
    prompt: `Given a project called "${name}" with description: "${description}"

Available categories: ${availableCategories.join(', ')}

Select the 3-5 most relevant categories from the available list. Return ONLY a JSON array of category names, nothing else. Example: ["Category1", "Category2", "Category3"]`,
  });

  try {
    const parsed = JSON.parse(text.trim());
    return Array.isArray(parsed)
      ? parsed.filter((c: string) => availableCategories.includes(c))
      : [];
  } catch {
    return [];
  }
}

/**
 * Auto-fill project fields from a website URL.
 *
 * Fetches the URL, extracts meta/OG tags + a slice of body text, and asks
 * the model for a structured object that matches the submission schema.
 */
export interface ProjectInfoFromUrl {
  name: string;
  short_description: string;
  full_description: string;
  suggested_categories: string[];
  tags: string[];
  logo_url: string | null;
}

export async function generateProjectInfoFromUrl(
  url: string,
  availableCategories: string[],
): Promise<ProjectInfoFromUrl> {
  ensureAIAvailable();

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must use http or https');
  }

  // ─── Fetch the page (best-effort; tolerate slow / large responses) ──
  let html = '';
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 8000);
    const res = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'AILaunchSpace-AutoFill/1.0 (+https://www.ailaunch.space)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: ac.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    html = (await res.text()).slice(0, 200_000); // cap raw payload
  } catch (err) {
    throw new Error(
      `Failed to fetch ${parsed.hostname}: ${err instanceof Error ? err.message : 'unknown error'}`,
    );
  }

  const meta = extractPageSummary(html, parsed);
  const truncatedBody = stripHtmlBody(html).slice(0, 4000);

  const schemaPrompt = `Categories the user can choose from (pick 1-4 most relevant by exact name): ${availableCategories.join(', ')}`;

  const prompt = `You are helping a founder submit their AI project to a directory. Fill in the listing fields based on the website content below.

Website URL: ${parsed.toString()}

<title>${meta.title ?? ''}</title>
<meta:description>${meta.description ?? ''}</meta:description>
<og:title>${meta.ogTitle ?? ''}</og:title>
<og:description>${meta.ogDescription ?? ''}</og:description>
<og:image>${meta.ogImage ?? ''}</og:image>

Body text (truncated):
${truncatedBody}

${schemaPrompt}

Rules:
- "name" is the product name (typically what's in <title> before any "—" or "|"). 1–60 chars.
- "short_description" is a single-sentence pitch, max 100 chars, no marketing fluff.
- "full_description" is 120–280 words, professional tone, no headers, plain prose.
- "suggested_categories" must contain values from the provided list, exact matching, 1–4 items.
- "tags" are 3–8 short lowercase tags (single words or hyphenated), no leading "#".
- If you cannot determine a field with confidence, use a sensible best guess derived from the page content.`;

  const { generateObject } = await import('ai');
  const { z } = await import('zod');
  const model = await getModel();

  const ProjectInfoSchema = z.object({
    name: z.string().min(1).max(80),
    short_description: z.string().min(1).max(100),
    full_description: z.string().min(50),
    suggested_categories: z.array(z.string()).min(1).max(4),
    tags: z.array(z.string()).min(0).max(8),
  });

  const { object } = await generateObject({
    model,
    schema: ProjectInfoSchema,
    prompt,
    temperature: 0.3,
  });

  return {
    name: object.name.trim(),
    short_description: object.short_description.trim(),
    full_description: object.full_description.trim(),
    suggested_categories: object.suggested_categories.filter((c) => availableCategories.includes(c)),
    tags: object.tags.map((t) => t.toLowerCase().replace(/^#/, '').trim()).filter(Boolean),
    logo_url: meta.ogImage ?? null,
  };
}

interface PageSummary {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

function extractPageSummary(html: string, base: URL): PageSummary {
  const title = matchOne(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = matchMeta(html, 'name', 'description');
  const ogTitle = matchMeta(html, 'property', 'og:title');
  const ogDescription = matchMeta(html, 'property', 'og:description');
  let ogImage = matchMeta(html, 'property', 'og:image') ?? matchMeta(html, 'name', 'twitter:image');
  if (ogImage) {
    try {
      ogImage = new URL(ogImage, base).toString();
    } catch {
      ogImage = null;
    }
  }
  return {
    title: title ? decodeEntities(title.trim()) : null,
    description: description ? decodeEntities(description.trim()) : null,
    ogTitle: ogTitle ? decodeEntities(ogTitle.trim()) : null,
    ogDescription: ogDescription ? decodeEntities(ogDescription.trim()) : null,
    ogImage: ogImage ?? null,
  };
}

function matchOne(html: string, re: RegExp): string | null {
  const m = re.exec(html);
  return m ? m[1] : null;
}

function matchMeta(html: string, attr: 'name' | 'property', value: string): string | null {
  // Match <meta name|property="value" content="..."> in any attribute order.
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${escaped}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${escaped}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m) return m[1];
  }
  return null;
}

function stripHtmlBody(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

export async function generateSeoMeta(
  name: string,
  description: string,
): Promise<{ title: string; metaDescription: string; keywords: string[] }> {
  ensureAIAvailable();

  const { generateText } = await import('ai');
  const model = await getModel();

  const { text } = await generateText({
    model,
    maxOutputTokens: 300,
    temperature: 0.5,
    prompt: `Generate SEO-optimized metadata for a project called "${name}" with description: "${description}"

Return a JSON object with:
- title: SEO-optimized page title (50-60 characters)
- metaDescription: Meta description (150-160 characters)
- keywords: Array of 5-10 relevant keywords

Return ONLY the JSON object, nothing else.`,
  });

  try {
    return JSON.parse(text.trim());
  } catch {
    return {
      title: name,
      metaDescription: description.substring(0, 160),
      keywords: [],
    };
  }
}
