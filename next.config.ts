import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep typechecking on; only use ignore if a transient TS tooling issue blocks release.
  // typescript: { ignoreBuildErrors: true },
  eslint: {
    // Lint is run in CI separately; do not fail production image on ESLint noise.
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
      // Supabase storage / public assets (project ref varies)
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'xzfsthlurdlrnegzejeo.supabase.co', pathname: '/**' },
    ],
  },
};

export default nextConfig;
