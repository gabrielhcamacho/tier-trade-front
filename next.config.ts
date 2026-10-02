import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@mountier/tier-trade-design-system'],
};

export default nextConfig;
