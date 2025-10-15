/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_ZEGO_APP_ID: "1814050585",
    NEXT_PUBLIC_ZEGO_SERVER_ID: "fd5f8007cdc0e6697f603cc600eac7e4",
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
