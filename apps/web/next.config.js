/** @type {import('next').NextConfig} */

// Unique build ID baked into every deploy — changes on every build
const BUILD_TIME = Date.now().toString();

const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // Expose build time so layout.tsx can use it as a cache-bust version
  env: {
    NEXT_PUBLIC_BUILD_TIME: BUILD_TIME,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '7070',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'stannel-api-1094694418275.me-west1.run.app',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    quality: 65,
  },
  // Enable standalone output for Cloud Run production builds
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Webpack runtime chunk: same filename across builds but different content.
        // Must NOT be cached by Firebase CDN or browser, otherwise old chunk
        // registry references cause 404s for new page chunks.
        source: '/_next/static/chunks/webpack-:hash.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // HTML pages: no-store so Firebase CDN and browsers never cache HTML.
        // Chunk hashes change every deploy; stale HTML = stale chunk URLs = 404s.
        source: '/((?!_next/static|_next/image|favicon.ico|logoNew|bg_top).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
