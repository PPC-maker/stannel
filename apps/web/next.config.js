/** @type {import('next').NextConfig} */
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/stannel-assets/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable static exports for Cloud Run
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};

module.exports = nextConfig;
