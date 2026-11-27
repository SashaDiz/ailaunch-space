/**
 * SEO copy for category pages, built only from the live listings in the
 * category, so every number and name in the title, intro and FAQ is true.
 * Pure (no imports): tested in tests/category-seo.test.mjs.
 */

export type CategoryListing = {
  name: string;
  slug: string;
  pricing?: string | null;
  views?: number | null;
  upvotes?: number | null;
  published_at?: string | null;
  launched_at?: string | null;
  created_at?: string | null;
};

export type CategoryFacts = {
  total: number;
  free: number;
  freemium: number;
  paid: number;
  newest: string | null;
  top: Array<{ name: string; slug: string }>;
};

const kind = (pricing?: string | null) => {
  const value = String(pricing || '').trim().toLowerCase();
  if (value === 'freemium') return 'freemium';
  if (value === 'free') return 'free';
  if (value) return 'paid';
  return 'unknown';
};

export function categoryFacts(listings: CategoryListing[]): CategoryFacts {
  const counts = { free: 0, freemium: 0, paid: 0, unknown: 0 };
  let newest: string | null = null;
  for (const listing of listings) {
    counts[kind(listing.pricing)]++;
    const date = listing.published_at || listing.launched_at || listing.created_at || null;
    if (date && (!newest || date > newest)) newest = date;
  }
  // Most upvoted first, then most viewed: the same signals the catalog sorts by.
  const top = [...listings]
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0) || (b.views || 0) - (a.views || 0) || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map(({ name, slug }) => ({ name, slug }));
  return { total: listings.length, free: counts.free, freemium: counts.freemium, paid: counts.paid, newest, top };
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const listNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

/** "AI" is already in many category names ("AI Agents"): don't say "AI AI tools". */
export function toolsPhrase(categoryName: string) {
  return /\bai\b/i.test(categoryName) ? `${categoryName} tools` : `${categoryName} AI tools`;
}

export function categoryTitle(categoryName: string, year: number) {
  return `Best ${toolsPhrase(categoryName)} in ${year}`;
}

export function categorySummary(facts: CategoryFacts, dateLabel: (iso: string) => string) {
  const parts = [plural(facts.total, 'tool')];
  if (facts.free) parts.push(`${facts.free} free`);
  if (facts.freemium) parts.push(`${facts.freemium} freemium`);
  if (facts.newest) parts.push(`newest added ${dateLabel(facts.newest)}`);
  return parts.join(' · ');
}

export function categoryFaq(
  categoryName: string,
  facts: CategoryFacts,
  opts: { siteName: string; year: number; premiumPrice: number; dateLabel: (iso: string) => string },
): Array<{ question: string; answer: string }> {
  const tools = toolsPhrase(categoryName);
  const faq: Array<{ question: string; answer: string }> = [];
  if (!facts.total) return faq;

  if (facts.top.length) {
    faq.push({
      question: `What are the best ${tools} in ${opts.year}?`,
      answer: `The most popular ${tools} on ${opts.siteName}, ranked by upvotes and views from our visitors, are ${listNames(facts.top.map((t) => t.name))}. The full list above covers ${plural(facts.total, 'tool')}, and you can sort it by newest or most popular.`,
    });
  }

  const freeAnswer = facts.free || facts.freemium
    ? `Yes. ${facts.free ? `${plural(facts.free, 'tool')} in this category ${facts.free === 1 ? 'is' : 'are'} free` : ''}${facts.free && facts.freemium ? ', and ' : ''}${facts.freemium ? `${plural(facts.freemium, 'tool')} ${facts.freemium === 1 ? 'has' : 'have'} a free plan with paid upgrades (freemium)` : ''}. Use the pricing filter to show only free options.`
    : `Not at the moment: every ${tools.replace(/ tools$/, '')} tool listed here is paid. Check each listing for trials.`;
  faq.push({ question: `Are there free ${tools}?`, answer: freeAnswer });

  faq.push({
    question: `How many ${tools} are listed on ${opts.siteName}?`,
    answer: `${plural(facts.total, 'tool')} ${facts.total === 1 ? 'is' : 'are'} live in this category${facts.newest ? `, the newest added on ${opts.dateLabel(facts.newest)}` : ''}. New tools are added every week.`,
  });

  faq.push({
    question: `How do I add my ${tools.replace(/ tools$/, ' tool')} to this list?`,
    answer: `Submit it on ${opts.siteName}. A free listing needs our badge on your site and is reviewed by hand, which currently takes about 2 weeks. A Premium listing costs $${opts.premiumPrice} once: it goes live immediately with no review, keeps a dofollow link for life and is shown at the top of the directory.`,
  });
  return faq;
}
