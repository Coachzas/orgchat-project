/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_ZEGO_APP_ID: "433408785",
    ZEGO_SERVER_SECRET: "69db67b09cde911902a303e5a2a2a6fd",
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3005", 
      },
    ],
  },
  // Proxy API calls to backend during development so browser sees a single origin
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3005/api/:path*',
      },
      // Proxy uploads (images/files) so client can request /uploads/* and Next will forward to backend
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3005/uploads/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
