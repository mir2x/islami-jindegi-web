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
  async headers() {
    return [
      {
        // Must never be cached: this is the worker that removes the old Ember
        // service worker, so browsers have to see it on every update check.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // The admin shell is a client component, so Next prerenders it and
        // advertises s-maxage=31536000 on a URL with no content hash. Harmless
        // while Cloudflare passes HTML through, but a "Cache Everything" rule
        // would pin the admin app for a year with no way to purge from here.
        source: '/:locale/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
};

export default withNextIntl(nextConfig);
