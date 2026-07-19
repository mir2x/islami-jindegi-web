import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ['192.168.68.54'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static.islamijindegi.com' },
      { protocol: 'https', hostname: '*.fly.storage.tigris.dev' },
    ],
  },
  turbopack: {},
};

export default withNextIntl(nextConfig);
