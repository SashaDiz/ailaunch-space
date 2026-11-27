import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryFacts, categoryFaq, categorySummary, categoryTitle } from '../lib/category-seo.ts';

const listings = [
  { name: 'Alpha', slug: 'alpha', pricing: 'Free', upvotes: 1, views: 10, published_at: '2026-11-01T00:00:00Z' },
  { name: 'Beta', slug: 'beta', pricing: 'Freemium', upvotes: 5, views: 3, published_at: '2026-11-20T00:00:00Z' },
  { name: 'Gamma', slug: 'gamma', pricing: 'Paid', upvotes: 1, views: 50, published_at: '2026-10-01T00:00:00Z' },
  { name: 'Delta', slug: 'delta', pricing: 'freemium', upvotes: 0, views: 0, created_at: '2026-09-01T00:00:00Z' },
];
const opts = { siteName: 'AI Launch Space', year: 2026, premiumPrice: 4.99, dateLabel: (iso) => iso.slice(0, 10) };

test('facts count pricing case-insensitively and rank by upvotes, then views', () => {
  const facts = categoryFacts(listings);
  assert.equal(facts.total, 4);
  assert.equal(facts.free, 1);
  assert.equal(facts.freemium, 2);
  assert.equal(facts.paid, 1);
  assert.equal(facts.newest, '2026-11-20T00:00:00Z');
  assert.deepEqual(facts.top.map((t) => t.name), ['Beta', 'Gamma', 'Alpha']);
});

test('title does not double "AI"', () => {
  assert.equal(categoryTitle('Video', 2026), 'Best Video AI tools in 2026');
  assert.equal(categoryTitle('AI Agents', 2026), 'Best AI Agents tools in 2026');
});

test('summary and FAQ only state real numbers and names', () => {
  const facts = categoryFacts(listings);
  assert.equal(categorySummary(facts, opts.dateLabel), '4 tools · 1 free · 2 freemium · newest added 2026-11-20');
  const faq = categoryFaq('Video', facts, opts);
  assert.match(faq[0].answer, /Beta, Gamma and Alpha/);
  assert.match(faq[1].answer, /^Yes\. 1 tool in this category is free, and 2 tools have a free plan/);
  assert.match(faq[2].answer, /4 tools are live/);
  assert.match(faq[3].answer, /about 2 weeks/);
});

test('no free tools and empty categories', () => {
  const paidOnly = categoryFacts([{ name: 'P', slug: 'p', pricing: 'Paid' }]);
  assert.match(categoryFaq('Video', paidOnly, opts)[1].answer, /^Not at the moment/);
  assert.deepEqual(categoryFaq('Video', categoryFacts([]), opts), []);
});
