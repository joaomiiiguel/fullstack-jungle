import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/wallets/:path*',
        destination: 'http://localhost:4002/wallets/:path*', 
      },
      {
        source: '/api/games/:path*',
        destination: 'http://localhost:4001/games/:path*',
      }
    ];
  },
};

export default nextConfig;
