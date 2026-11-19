import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/api/catalog/:path*', destination: `${process.env.API_INTERNAL_URL || 'http://backend:3001/api'}/catalog/:path*` }];
  },
};
export default nextConfig;
