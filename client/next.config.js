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
};

module.exports = nextConfig;
