import type { SiteConfig } from '@/types/config';

/**
 * Site Configuration
 *
 * Central place for all brand-related settings.
 * Change these values to customize the platform for your directory.
 *
 * This config is imported across the entire codebase —
 * update once, changes propagate everywhere.
 */
export const siteConfig: SiteConfig = {
  // ─── Brand ───────────────────────────────────────────────────────────────────
  name: 'AI Launch Space',
  tagline: 'Discover AI tools built by indie hackers and founders',
  description:
    'A curated directory of AI tools, agents, and apps. Find your next favorite — or submit yours and reach builders and early adopters.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.ailaunch.space',

  // ─── Assets ──────────────────────────────────────────────────────────────────
  logo: {
    light: '/assets/logo.svg',
    dark: '/assets/logo-white.svg',
  },
  favicon: '/assets/favicon/favicon.ico',
  ogImage: '/assets/og-image.png',

  // ─── Social ──────────────────────────────────────────────────────────────────
  social: {
    twitter: '@ailaunchspace',
    // github: 'https://github.com/your-org',
    // discord: 'https://discord.gg/your-invite',
  },

  // ─── Contact ─────────────────────────────────────────────────────────────────
  contact: {
    email: 'hello@ailaunch.space',
    supportEmail: 'support@ailaunch.space',
    privacyEmail: 'privacy@ailaunch.space',
  },

  // ─── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    copyright: `© ${new Date().getFullYear()} AI Launch Space. All rights reserved.`,
    description:
      'A directory of AI tools shipped by indie hackers, founders, and small teams. Submit your project and get discovered.',
  },

  // ─── SEO & Links ─────────────────────────────────────────────────────────────
  refParameter: 'ailaunchspace',
  keywords: [
    'AI tools',
    'AI directory',
    'AI apps',
    'indie AI',
    'AI agents',
    'AI startups',
    'AI launch',
    'machine learning tools',
    'GPT tools',
    'AI product directory',
  ],
  language: 'en',
  locale: 'en_US',
  themeColor: '#ED0D79',
};
