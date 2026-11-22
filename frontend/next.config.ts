import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  async rewrites() {
    return ['catalog', 'auth', 'admin', 'media', 'events'].map(section => ({ source: `/api/${section}/:path*`, destination: `${process.env.API_INTERNAL_URL || 'http://backend:3001/api'}/${section}/:path*` }));
  },
};
export default nextConfig;
