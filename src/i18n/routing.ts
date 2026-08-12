import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['bn', 'en'],
  defaultLocale: 'bn',
  localePrefix: 'always',
  // Bangla-first: don't sniff Accept-Language — every visitor lands on /bn
  // regardless of device language. English stays reachable via the switcher
  // and /en URLs.
  localeDetection: false,
})

export type Locale = (typeof routing.locales)[number]
