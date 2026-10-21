import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/jetzfernandez',
        destination: '/staff/MK-C052',
      },
      {
        source: '/jetz-fernandez',
        destination: '/staff/MK-C052',
      },
      {
        source: '/jetz',
        destination: '/staff/MK-C052',
      },
      {
        source: '/staff/jetzfernandez',
        destination: '/staff/MK-C052',
      },
      {
        source: '/staff/jetz-fernandez',
        destination: '/staff/MK-C052',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors *",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
