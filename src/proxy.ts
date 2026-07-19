import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Skip api routes, static files, Next internals, and files with an extension
    '/((?!api|_next|.*\\..*).*)',
  ],
}
