import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  submissionReceivedEmail, submissionApprovedEmail, submissionDeclinedEmail, newsletterWelcomeEmail, welcomeEmail,
} from '../lib/email-templates.ts';
import { isValidUnsubscribeToken, unsubscribeToken } from '../lib/unsubscribe-token.ts';

const site = { name: 'AI Launch Space', url: 'https://www.ailaunch.space', contactEmail: 'hello@ailaunch.space' };
const promo = {
  sponsors: [
    { name: 'PosteAhora', description: 'Schedule posts', logoUrl: 'https://cdn.example.com/p.png', url: 'https://posteahora.com/', cta: 'Start scheduling' },
    { name: 'Evil <b>', description: null, logoUrl: 'https://cdn.example.com/logo.svg', url: 'javascript:alert(1)', cta: null },
  ],
  featured: [{ name: 'RoCode', slug: 'rocode', logoUrl: null, tagline: 'Code faster' }],
};

test('every email carries the sponsors, featured projects and an ad slot', () => {
  const html = welcomeEmail({ userName: 'Sasha' }, { site, promo });
  assert.match(html, /Sponsored/);
  assert.match(html, /Start scheduling/);
  assert.match(html, /https:\/\/posteahora\.com\//);
  assert.match(html, /Featured on AI Launch Space/);
  assert.match(html, /\/project\/rocode/);
  assert.match(html, /your product here/);
});

test('sponsor data cannot inject markup, scripts or SVG logos', () => {
  const html = welcomeEmail({}, { site, promo });
  assert.ok(!html.includes('javascript:'));
  assert.ok(!html.includes('logo.svg'));
  assert.ok(html.includes('Evil &lt;b&gt;'));
});

test('free submission explains the 2-week review, the badge and the Premium shortcut', () => {
  const html = submissionReceivedEmail({ projectName: 'Demo', plan: 'standard' }, { site, promo });
  assert.match(html, /about 2 weeks/);
  assert.match(html, /Keep our badge on your site/);
  assert.match(html, /\$4\.99/);
  assert.ok(!/24-48|launch week|competition/i.test(html));
});

test('a premium draft asks for payment, a paid premium listing says it is live', () => {
  assert.match(submissionReceivedEmail({ projectName: 'Demo', plan: 'premium', status: 'draft' }, { site }), /Complete payment/);
  assert.match(submissionReceivedEmail({ projectName: 'Demo', plan: 'premium', status: 'live', slug: 'demo' }, { site }), /Demo is live/);
});

test('approval states the real link type', () => {
  assert.match(submissionApprovedEmail({ projectName: 'D', plan: 'standard', dofollow: true }, { site }), /while the badge is up/);
  assert.match(submissionApprovedEmail({ projectName: 'D', plan: 'standard', dofollow: false }, { site }), /nofollow/);
  assert.match(submissionApprovedEmail({ projectName: 'D', plan: 'premium', dofollow: true }, { site }), /for life/);
});

test('reviewer feedback is escaped', () => {
  const html = submissionDeclinedEmail({ projectName: 'D', rejectionReason: '<img src=x onerror=1>' }, { site });
  assert.ok(html.includes('&lt;img src=x onerror=1&gt;'));
});

test('newsletter makes no promises the site does not keep and links a real unsubscribe', () => {
  const html = newsletterWelcomeEmail({ unsubscribeUrl: 'https://www.ailaunch.space/api/newsletter/unsubscribe?email=a%40b.c&token=t' }, { site });
  assert.ok(!/competition|every Monday|500\+/i.test(html));
  assert.match(html, /api\/newsletter\/unsubscribe/);
});

test('unsubscribe tokens are bound to the address and the secret', () => {
  const token = unsubscribeToken('A@B.com ', 's3cret');
  assert.ok(isValidUnsubscribeToken('a@b.com', token, 's3cret'));
  assert.ok(!isValidUnsubscribeToken('c@b.com', token, 's3cret'));
  assert.ok(!isValidUnsubscribeToken('a@b.com', token, 'other'));
  assert.ok(!isValidUnsubscribeToken('a@b.com', 'x', 's3cret'));
});
