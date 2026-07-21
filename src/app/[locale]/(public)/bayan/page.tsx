import { getBayans, getBayanCategories, getBayanAuthors } from '@/lib/public-api'
import { BayanClient } from '@/components/public/bayan/bayan-client'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'BayanPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function BayanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; author?: string }>
}) {
  const sp = await searchParams

  const [bayansResult, categories, authors] = await Promise.all([
    getBayans({
      search: sp.q,
      categoryId: sp.category,
      authorId: sp.author,
      page: 1,
    }),
    getBayanCategories(),
    getBayanAuthors(),
  ])

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:h-[calc(100vh-68px)] lg:flex lg:flex-col">
      <BayanClient
        initialBayans={bayansResult?.data ?? []}
        initialTotal={bayansResult?.total ?? 0}
        categories={categories}
        authors={authors}
        initialSearch={sp.q ?? ''}
        initialCategory={sp.category ?? ''}
        initialAuthor={sp.author ?? ''}
      />
    </div>
  )
}
