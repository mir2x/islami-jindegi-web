import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

async function loadMessages(locale: string) {
  const [common, publicMessages, reader, admin] = await Promise.all([
    import(`../../messages/${locale}/common.json`).then((m) => m.default),
    import(`../../messages/${locale}/public.json`).then((m) => m.default),
    import(`../../messages/${locale}/reader.json`).then((m) => m.default),
    import(`../../messages/${locale}/admin.json`).then((m) => m.default),
  ])

  return { ...common, ...publicMessages, ...reader, ...admin }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: await loadMessages(locale),
  }
})
