/**
 * Field limits for a project listing. One source for the submit form, the
 * API's sanitizer and the AI auto-fill, so generated text always fits.
 */
export const LISTING_LIMITS = {
  nameMax: 60,
  shortDescriptionMin: 10,
  shortDescriptionMax: 100,
  fullDescriptionMin: 50,
  fullDescriptionMax: 3000,
  categoriesMax: 3,
  tagsMax: 8,
} as const;

/** Cut text to `max` characters on a word (or sentence) boundary, never mid-word. */
export function clampText(text: string, max: number): string {
  const clean = String(text ?? '').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentenceEnd > max * 0.6) return cut.slice(0, sentenceEnd + 1).trim();
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:–—-]+$/, '').trim();
}

/** Keep only names from `allowed` (case-insensitive, canonical spelling), unique, at most `max`. */
export function pickCategories(suggested: unknown, allowed: string[], max: number = LISTING_LIMITS.categoriesMax): string[] {
  if (!Array.isArray(suggested)) return [];
  const byLower = new Map(allowed.map((name) => [name.toLowerCase(), name]));
  const picked: string[] = [];
  for (const raw of suggested) {
    const name = byLower.get(String(raw).trim().toLowerCase());
    if (name && !picked.includes(name)) picked.push(name);
    if (picked.length >= max) break;
  }
  return picked;
}
