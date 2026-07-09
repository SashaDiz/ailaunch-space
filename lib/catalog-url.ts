/**
 * Catalog URL contract — single source of truth for serializing / parsing
 * catalog listing state (page, categories, pricing, sort, search) into URLs.
 *
 * Used by BOTH the server (catalog pages read `await searchParams`) and the
 * client (HomePageClient / CategoryDetailClient / Pagination build hrefs), so
 * SSR and client navigation always produce the identical URL for a given state.
 *
 * Canonical key order: category → pricing → sort → q → page.
 * Default values are omitted from the URL so one state maps to exactly one URL.
 *
 * Filters and pagination are mutually exclusive: when any filter is active
 * (category / pricing / search) the listing shows ALL matching items on one
 * page and `page` is never part of the URL. `page` only applies to the
 * unfiltered base listing. Sort is a reorder, not a filter — it keeps pagination.
 *
 * All valid values are derived from config (directoryConfig / siteConfig),
 * never hard-coded — see the reference screenshots' paths are illustrative only.
 */
import {
  directoryConfig,
  getSortValues,
  getPricingValues,
} from '@/config/directory.config';
import { siteConfig } from '@/config/site.config';

export interface CatalogState {
  /** Category slugs, de-duplicated and sorted alphabetically for URL stability. */
  categories: string[];
  /** Pricing filter value (from directoryConfig.pricingOptions); 'all' = default. */
  pricing: string;
  /** Sort key (from directoryConfig.sortOptions); defaultSort = default. */
  sort: string;
  /** Free-text search query (public param `q`); '' = default. */
  q: string;
  /** 1-based page number. */
  page: number;
  /** True when a `page` param was present but invalid (NaN / < 1) → caller should 404. */
  pageInvalid: boolean;
}

const DEFAULT_SORT = directoryConfig.defaultSort;
const DEFAULT_PRICING = 'all';

/**
 * A filter is active when the listing is scoped down to a subset — category,
 * pricing, or a search query. Sort does NOT count (it only reorders).
 * When true, the catalog shows all matches on one page (no pagination).
 */
export function hasActiveFilter(state: {
  categories?: string[];
  pricing?: string;
  q?: string;
}): boolean {
  return (
    (state.categories?.length ?? 0) > 0 ||
    (!!state.pricing && state.pricing !== DEFAULT_PRICING) ||
    !!state.q
  );
}

type ParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function readParam(sp: ParamsInput, key: string): string | undefined {
  if (typeof (sp as URLSearchParams).get === 'function') {
    return (sp as URLSearchParams).get(key) ?? undefined;
  }
  const v = (sp as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

/** Parse and validate catalog state from a URLSearchParams or awaited searchParams object. */
export function parseCatalogParams(sp: ParamsInput): CatalogState {
  const rawCategory = readParam(sp, 'category');
  const categories = rawCategory
    ? Array.from(
        new Set(
          rawCategory
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      ).sort()
    : [];

  const rawPricing = readParam(sp, 'pricing');
  const pricing =
    rawPricing && getPricingValues().includes(rawPricing)
      ? rawPricing
      : DEFAULT_PRICING;

  const rawSort = readParam(sp, 'sort');
  const sort =
    rawSort && getSortValues().includes(rawSort) ? rawSort : DEFAULT_SORT;

  const q = (readParam(sp, 'q') ?? '').trim();

  // Pagination only applies to the unfiltered listing. When a filter is active
  // the `page` param is meaningless (all items render on one page) — ignore it.
  const filterActive = hasActiveFilter({ categories, pricing, q });

  const rawPage = readParam(sp, 'page');
  let page = 1;
  let pageInvalid = false;
  if (!filterActive && rawPage != null && rawPage !== '') {
    const n = Number(rawPage);
    if (!Number.isInteger(n) || n < 1) {
      pageInvalid = true;
    } else {
      page = n;
    }
  }

  return { categories, pricing, sort, q, page, pageInvalid };
}

function enc(v: string): string {
  return encodeURIComponent(v);
}

/**
 * Serialize catalog state to a relative URL (path + canonical-ordered query).
 * `basePath` carries the category on category pages (e.g. `/categories/saas`),
 * in which case `state.categories` should be empty (the path already scopes it).
 */
export function serializeCatalog(
  state: Partial<CatalogState>,
  basePath = '/'
): string {
  const parts: string[] = [];

  const categories = (state.categories ?? []).filter(Boolean);
  if (categories.length) {
    parts.push(`category=${categories.map(enc).join(',')}`);
  }
  if (state.pricing && state.pricing !== DEFAULT_PRICING) {
    parts.push(`pricing=${enc(state.pricing)}`);
  }
  if (state.sort && state.sort !== DEFAULT_SORT) {
    parts.push(`sort=${enc(state.sort)}`);
  }
  if (state.q) {
    parts.push(`q=${enc(state.q)}`);
  }
  // `page` is emitted only for the unfiltered listing (filters show all items).
  if (
    !hasActiveFilter(state) &&
    categories.length === 0 &&
    state.page &&
    state.page > 1
  ) {
    parts.push(`page=${state.page}`);
  }

  return parts.length ? `${basePath}?${parts.join('&')}` : basePath;
}

function absolute(path: string): string {
  return `${siteConfig.url.replace(/\/$/, '')}${path}`;
}

/**
 * Absolute canonical URL for a catalog state.
 *
 * Rules:
 * - Category landing page (basePath !== '/') → clean self `/categories/{slug}`
 *   (no facets, no pagination — the page always shows all items).
 * - Home + single category → consolidate to `/categories/{slug}`.
 * - Home + any other active filter (multi-category / pricing / search) → `/`.
 * - Home unfiltered → self, preserving page (sort is stripped).
 */
export function catalogCanonical(state: CatalogState, basePath = '/'): string {
  if (basePath !== '/') {
    return absolute(basePath);
  }

  if (state.categories.length === 1) {
    return absolute(`/categories/${state.categories[0]}`);
  }

  if (hasActiveFilter(state)) {
    return absolute('/');
  }

  // Unfiltered: strip sort, keep pagination.
  return absolute(serializeCatalog({ page: state.page }, '/'));
}

/**
 * Robots directive for a catalog state.
 * noindex when the state is a low-value / combinatorial facet:
 *   - any search query `q`
 *   - multi-category selection on the home catalog
 */
export function catalogRobots(
  state: CatalogState,
  basePath = '/'
): { index: boolean; follow: boolean } {
  const isHome = basePath === '/';
  const noindex = Boolean(state.q) || (isHome && state.categories.length > 1);
  return { index: !noindex, follow: true };
}
