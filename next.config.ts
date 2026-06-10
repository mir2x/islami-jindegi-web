import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['192.168.68.54'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static.islamijindegi.com' },
      { protocol: 'https', hostname: '*.fly.storage.tigris.dev' },
    ],
  },
  webpack: (config) => {
    // react-pdf: canvas is optional, disable to avoid build errors in Next.js
    config.resolve.alias.canvas = false
    return config
  },
};

export default nextConfig;
