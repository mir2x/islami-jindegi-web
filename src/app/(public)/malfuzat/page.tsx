import type { Metadata } from 'next'
import { getMalfuzats, getMalfuzatCategories, getMalfuzatAuthors } from '@/lib/public-api'
import { MalfuzatClient } from '@/components/public/malfuzat/malfuzat-client'

export const metadata: Metadata = {
  title: 'মালফুযাত | ইসলামী যিন্দেগী',
  description: 'হযরতদের মালফুযাত ও বাণী সংগ্রহ',
}

type Tab = 'all' | 'text' | 'audio'

export default async function MalfuzatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; author?: string; tab?: string }>
}) {
  const sp = await searchParams
  const tab = (sp.tab === 'text' || sp.tab === 'audio' ? sp.tab : 'all') as Tab
  const hasAudio = tab === 'audio' ? true : tab === 'text' ? false : undefined

  const [result, categories, authors] = await Promise.all([
    getMalfuzats({
      search: sp.q,
      categoryId: sp.category,
      authorId: sp.author,
      page: 1,
      hasAudio,
    }),
    getMalfuzatCategories(),
    getMalfuzatAuthors(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:h-[calc(100vh-68px)] lg:flex lg:flex-col">
      <MalfuzatClient
        initialItems={result?.data ?? []}
        initialTotal={result?.total ?? 0}
        categories={categories}
        authors={authors}
        initialSearch={sp.q ?? ''}
        initialCategory={sp.category ?? ''}
        initialAuthor={sp.author ?? ''}
        initialTab={tab}
      />
    </div>
  )
}
