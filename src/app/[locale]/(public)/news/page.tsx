import { NewsClient } from '@/components/public/news/news-client'
import { getNewsList } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'NewsPage' })
  return { title: t('metaTitle') }
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const search = sp.q ?? ''
  const page = Number(sp.page ?? 1)

  const result = await getNewsList({ search: search || undefined, page })
  const t = await getTranslations('NewsPage')

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
      </div>
      <NewsClient
        initialItems={result?.data ?? []}
        initialTotal={result?.total ?? 0}
        initialSearch={search}
      />
    </div>
  )
}
