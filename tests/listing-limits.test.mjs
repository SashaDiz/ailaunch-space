import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LISTING_LIMITS, clampText, pickCategories } from '../lib/listing-limits.ts';

test('pickCategories keeps only known names, canonical case, unique, at most 3', () => {
  const allowed = ['Productivity', 'Education', 'SaaS', 'Other'];
  assert.deepEqual(
    pickCategories(['productivity', 'Education', 'Made Up', 'SaaS', 'Other', 'Education'], allowed),
    ['Productivity', 'Education', 'SaaS'],
  );
  assert.deepEqual(pickCategories('nope', allowed), []);
  assert.equal(LISTING_LIMITS.categoriesMax, 3);
});

test('clampText never exceeds the limit and does not cut words', () => {
  const text = 'Appshift builds calm apps for focused people. '.repeat(10);
  const out = clampText(text, 100);
  assert.ok(out.length <= 100);
  assert.ok(out.endsWith('.'));
  const words = clampText('alpha beta gamma delta epsilon', 18);
  assert.equal(words, 'alpha beta gamma');
  assert.equal(clampText('short', 100), 'short');
});
