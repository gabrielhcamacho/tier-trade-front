import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@mountier/tier-trade-design-system'],
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://tier-trade-back-3pim3.ondigitalocean.app',
  },
};

export default nextConfig;
