/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/yuhonas/**',
      },
      {
        protocol: 'https',
        hostname: 'v2.exercisedb.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'exercisedb.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.exercisedb.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.musclewiki.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'wger.de',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
    ],
    // GIF'ler için optimize etmeyi devre dışı bırak
    unoptimized: false,
  },
};

module.exports = nextConfig;
