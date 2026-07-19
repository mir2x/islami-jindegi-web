import { getPageBySlug } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

// Mirrors the old site's /donation route, which renders the CMS page with slug 'donation'.
const SLUG = 'donation'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'DonatePage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function DonatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const page = await getPageBySlug(SLUG)
  const t = await getTranslations({ locale, namespace: 'DonatePage' })

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
