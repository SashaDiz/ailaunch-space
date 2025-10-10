/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "localhost",
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
    ],
  },
  serverExternalPackages: ["mongodb"],
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

    // Configure filesystem cache to reduce large string warnings
    if (config.cache && config.cache.type === "filesystem") {
      config.cache.maxMemoryGenerations = 0;
      config.cache.maxAge = 1000 * 60 * 60 * 24 * 7; // 1 week
    }

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
