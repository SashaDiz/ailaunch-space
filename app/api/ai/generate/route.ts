import { NextResponse } from 'next/server';
import { featureGuard } from '@/lib/features';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { db } from '@/lib/supabase/database';

export async function POST(request: Request) {
  const guard = featureGuard('ai');
  if (guard) return guard;

  const rateLimitResult = await checkRateLimit(request, 'general');
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    // Dynamically import AI functions only when the feature is enabled
    const {
      generateDescription,
      suggestCategories,
      generateSeoMeta,
      generateProjectInfoFromUrl,
    } = await import('@/lib/ai');

    const body = await request.json();
    const { type, ...params } = body;

    switch (type) {
      case 'from-url': {
        const { url } = params as { url?: string };
        if (!url || typeof url !== 'string') {
          return NextResponse.json({ error: 'url is required' }, { status: 400 });
        }
        const categories = await db.find('categories', {}, { projection: { name: 1 } });
        const categoryNames = categories.map((c: { name: string }) => c.name);
        const info = await generateProjectInfoFromUrl(url, categoryNames);
        return NextResponse.json({ success: true, data: info });
      }

      case 'description': {
        const { name, shortDesc, category } = params;
        if (!name || !shortDesc) {
          return NextResponse.json({ error: 'name and shortDesc are required' }, { status: 400 });
        }
        const description = await generateDescription(name, shortDesc, category || '');
        return NextResponse.json({ success: true, data: { description } });
      }

      case 'categories': {
        const { name, description } = params;
        if (!name || !description) {
          return NextResponse.json({ error: 'name and description are required' }, { status: 400 });
        }
        const categories = await db.find('categories', {}, { projection: { name: 1 } });
        const categoryNames = categories.map((c: any) => c.name);
        const suggestions = await suggestCategories(name, description, categoryNames);
        return NextResponse.json({ success: true, data: { categories: suggestions } });
      }

      case 'seo': {
        const { name, description } = params;
        if (!name) {
          return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }
        const seoMeta = await generateSeoMeta(name, description || '');
        return NextResponse.json({ success: true, data: seoMeta });
      }

      default:
        return NextResponse.json({ error: 'Invalid type. Use: from-url, description, categories, or seo' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI generation error:', error);
    const message = error instanceof Error ? error.message : 'AI generation failed';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
