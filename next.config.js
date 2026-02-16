/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ipfuswqvlpcraqcnmsub.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwZnVzd3F2bHBjcmFxY25tc3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTM0MjIsImV4cCI6MjA4NjcyOTQyMn0.2TOuizcRHSlI-TXY2ykQqNa0PucHv3ThExvr80_6u0M",
  },
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
