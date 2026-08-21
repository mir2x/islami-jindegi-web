import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const handleLocale = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  const response = handleLocale(request)

  // Locale redirects ship no Cache-Control by default, which leaves caching to
  // per-client heuristics. Pin them so no browser or CDN can hold on to one.
  if (response.status >= 300 && response.status < 400) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
  }

  return response
}

export const config = {
  matcher: [
    // Skip api routes, static files, Next internals, and files with an extension
    '/((?!api|_next|.*\\..*).*)',
  ],
}
