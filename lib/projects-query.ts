/**
 * Shared catalog listing query — single source of truth for building the
 * `apps` filter (categories / pricing / search) and fetching a paginated page.
 *
 * Reused by:
 *  - server catalog pages (homepage, /categories/[slug]) for SSR of the grid, and
 *  - the /api/projects GET route (which adds user-specific enrichment on top).
 *
 * Keeps DB query logic in one place so SSR and the API never diverge.
 */
import { db } from '@/lib/supabase/database';
import { directoryConfig, getSortFields } from '@/config/directory.config';

export interface CatalogQueryState {
  categories?: string[];
  pricing?: string;
  sort?: string;
  /** Free-text search (already length-validated by callers that need 400s). */
  q?: string;
  page?: number;
  limit?: number;
  status?: string;
  /**
   * When true, ignore pagination and return all matching items on one page
   * (used for filtered / category views). Capped at ALL_ITEMS_CAP.
   */
  all?: boolean;
}

/** Safety cap for "show all" mode so a huge result set can't be unbounded. */
const ALL_ITEMS_CAP = 1000;

const MAX_SEARCH_LENGTH = 100;

/** Escape regex metacharacters to prevent ReDoS from user search input. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the Mongo-style `apps` filter for a catalog listing.
 * Resolves category slugs/names against the `categories` table so both stored
 * slugs and display names match (mirrors legacy /api/projects behaviour).
 */
export async function buildCatalogFilter(
  state: CatalogQueryState
): Promise<Record<string, any>> {
  const filter: Record<string, any> = { status: state.status || 'live' };

  const categories = (state.categories || []).filter(Boolean);
  if (categories.length > 0) {
    const categoryDocs = await db.find('categories', {
      $or: categories.map((cat) => [{ slug: cat }, { name: cat }]).flat(),
    });

    if (categoryDocs.length > 0) {
      const allCategoryIds = categoryDocs.reduce((acc: string[], doc: any) => {
        acc.push(doc.slug, doc.name);
        return acc;
      }, []);
      filter.categories = { $overlaps: allCategoryIds };
    } else {
      filter.categories = { $overlaps: categories };
    }
  }

  const search = (state.q || '').trim().slice(0, MAX_SEARCH_LENGTH);
  if (search) {
    const safeSearch = escapeRegex(search);
    if (safeSearch.replace(/\\/g, '').length > 0) {
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { short_description: { $regex: safeSearch, $options: 'i' } },
        { full_description: { $regex: safeSearch, $options: 'i' } },
      ];
    }
  }

  const pricing = state.pricing;
  if (pricing && pricing !== 'all') {
    filter.$and = filter.$and || [];
    switch (pricing) {
      case 'free':
        filter.$and.push({
          $or: [
            { pricing: { $regex: /free/i } },
            { pricing: { $exists: false } },
            { pricing: '' },
          ],
        });
        break;
      case 'freemium':
        filter.$and.push({ pricing: { $regex: /freemium/i } });
        break;
      case 'paid':
        filter.$and.push({
          $and: [
            { pricing: { $exists: true } },
            { pricing: { $ne: '' } },
            { pricing: { $not: { $regex: /free/i } } },
            { pricing: { $not: { $regex: /^freemium$/i } } },
          ],
        });
        break;
    }
  }

  return filter;
}

export interface CatalogQueryResult {
  projects: any[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}

/**
 * Fetch one paginated page of catalog projects (no user enrichment).
 * `totalPages` is 0 when there are no matches.
 */
export async function getCatalogProjects(
  state: CatalogQueryState
): Promise<CatalogQueryResult> {
  const filter = await buildCatalogFilter(state);
  const sortOptions = getSortFields(state.sort || directoryConfig.defaultSort);
  const totalCount = await db.count('apps', filter);

  // "Show all" mode: single page with every match (filtered / category views).
  if (state.all) {
    const projects = await db.find('apps', filter, {
      sort: sortOptions,
      limit: ALL_ITEMS_CAP,
    });
    return {
      projects,
      totalCount,
      totalPages: totalCount > 0 ? 1 : 0,
      page: 1,
      limit: ALL_ITEMS_CAP,
    };
  }

  const page = Math.max(1, state.page || 1);
  const limit = Math.max(
    1,
    Math.min(100, state.limit || directoryConfig.pageSize)
  );
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;

  const projects = await db.find('apps', filter, {
    sort: sortOptions,
    limit,
    skip,
  });

  return { projects, totalCount, totalPages, page, limit };
}
