/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "localhost",
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
      "sdfzsocizvmgrisnlcvz.storage.supabase.co", // Supabase S3 storage domain
    ],
  },
  serverExternalPackages: ["mongodb", "@supabase/supabase-js", "@supabase/ssr"],
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

export default nextConfig;
