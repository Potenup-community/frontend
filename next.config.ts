import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /* config options here */
  images: {
    domains: ['api.dicebear.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
