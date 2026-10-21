/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
