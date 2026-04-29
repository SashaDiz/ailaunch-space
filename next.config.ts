import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Add your Supabase project storage hostname here, e.g.:
      // { protocol: 'https', hostname: '<project-id>.supabase.co' },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.logo.dev',
      },
    ],
  },
  // Add empty turbopack config to allow webpack to be used
  // Next.js 16 uses Turbopack by default, but we need webpack for our custom config
  turbopack: {},
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com; frame-ancestors 'none';`,
          },
        ],
      },
    ];
  },
  serverExternalPackages: ["mongodb", "@supabase/supabase-js", "@supabase/ssr", "@react-email/render", "resend"],
  async redirects() {
    return [
      // Legacy listing path → new home (catalog lives on the index now)
      { source: "/projects", destination: "/", permanent: true },
      { source: "/projects/:path*", destination: "/", permanent: true },
      // Removed weekly-competition surfaces — bounce SEO traffic to home
      { source: "/streaks", destination: "/", permanent: true },
      { source: "/streaks/:path*", destination: "/", permanent: true },
      { source: "/past-launches", destination: "/", permanent: true },
      { source: "/past-launches/:path*", destination: "/", permanent: true },
      { source: "/competitions", destination: "/", permanent: true },
      { source: "/competitions/:path*", destination: "/", permanent: true },
      // Legacy /apps slug pattern (if anything points there)
      { source: "/apps/:slug", destination: "/project/:slug", permanent: true },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // Suppress all webpack warnings in development
    if (dev) {
      config.stats = {
        ...config.stats,
        warnings: false,
      };

      config.infrastructureLogging = {
        level: "error",
      };
    }

    // Fix for React 19 compatibility and module loading issues
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      },
      // Ensure dynamic imports from resend can be resolved
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
    };

    // Add module rules for better compatibility
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    };

    // Configure filesystem cache to reduce large string warnings
    if (config.cache && config.cache.type === "filesystem") {
      config.cache.maxMemoryGenerations = 0;
      config.cache.maxAge = 1000 * 60 * 60 * 24 * 7; // 1 week
      config.cache.compression = 'gzip';
    }
    
    // Disable problematic webpack optimizations that cause module loading issues
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
    };

    // Split GSAP and large dependencies to reduce bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: "all",
          maxSize: 80000, // Even smaller chunks
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            gsap: {
              test: /[\\/]node_modules[\\/]gsap[\\/]/,
              name: "gsap-vendor",
              chunks: "all",
              enforce: true,
              priority: 20,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
              maxSize: 60000, // Very small vendor chunks
            },
          },
        },
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
