import { getDuas, getDuaCategories } from '@/lib/public-api'
import { DuaClient } from '@/components/public/dua/dua-client'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'DuaPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

type Tab = 'all' | 'text' | 'audio'

export default async function DuaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tab?: string }>
}) {
  const sp = await searchParams
  const tab = (sp.tab === 'text' || sp.tab === 'audio' ? sp.tab : 'all') as Tab
  const hasAudio = tab === 'audio' ? true : tab === 'text' ? false : undefined

  const [result, categories] = await Promise.all([
    getDuas({
      search: sp.q,
      categoryId: sp.category,
      page: 1,
      hasAudio,
    }),
    getDuaCategories(),
  ])

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:h-[calc(100vh-68px)] lg:flex lg:flex-col">
      <DuaClient
        initialItems={result?.data ?? []}
        initialTotal={result?.total ?? 0}
        categories={categories}
        initialSearch={sp.q ?? ''}
        initialCategory={sp.category ?? ''}
        initialTab={tab}
      />
    </div>
  )
}
