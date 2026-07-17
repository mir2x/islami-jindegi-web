import type { Metadata } from 'next'
import { getMasails, getMasailCategories, getMasailAuthors } from '@/lib/public-api'
import { MasailClient } from '@/components/public/masail/masail-client'

export const metadata: Metadata = {
  title: 'মাসাইল | ইসলামী যিন্দেগী',
  description: 'ইসলামী মাসাইল ও ফাতাওয়া সংগ্রহ',
}

type Tab = 'all' | 'text' | 'audio'

export default async function MasailPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; author?: string; tab?: string }>
}) {
  const sp = await searchParams
  const tab = (sp.tab === 'text' || sp.tab === 'audio' ? sp.tab : 'all') as Tab
  const hasAudio = tab === 'audio' ? true : tab === 'text' ? false : undefined

  const [result, categories, authors] = await Promise.all([
    getMasails({
      search: sp.q,
      categoryId: sp.category,
      authorId: sp.author,
      page: 1,
      hasAudio,
    }),
    getMasailCategories(),
    getMasailAuthors(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:h-[calc(100vh-68px)] lg:flex lg:flex-col">
      <MasailClient
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
