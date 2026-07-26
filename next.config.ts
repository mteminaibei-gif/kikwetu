import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint is optional in CI; do not block production deploys on lint noise.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Service-Worker-Allowed', value: '/' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'xzfsthlurdlrnegzejeo.supabase.co', pathname: '/**' },
    ],
  },
};

export default nextConfig;
