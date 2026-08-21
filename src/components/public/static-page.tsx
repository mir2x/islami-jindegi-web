import { getPageBySlug } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

/**
 * Renders a CMS-managed static page (admin → Pages) by slug.
 *
 * Headings and metadata come from `messages/*` so they follow the active
 * locale; the body is the admin-authored HTML and is served as-is, since
 * Pages hold a single (Bangla) body with no per-locale variants.
 */
export async function StaticPage({
  locale,
  slug,
  namespace,
}: {
  locale: string
  slug: string
  namespace: string
}) {
  const page = await getPageBySlug(slug)
  const t = await getTranslations({ locale, namespace })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-6">{t('heading')}</h1>

      {page?.body ? (
        <div
          className="prose-content text-[15px] leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      ) : (
        <p className="text-muted-foreground py-16 text-center">
          {t('unavailable')}
        </p>
      )}
    </div>
  )
}

/** Shared `generateMetadata` body for the static page routes. */
export async function staticPageMetadata(locale: string, namespace: string) {
  const t = await getTranslations({ locale, namespace })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}
