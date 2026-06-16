import type { Metadata } from 'next'
import { HelpCircle } from 'lucide-react'
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
  searchParams: Promise<{ q?: string; category?: string; author?: string; page?: string; tab?: string }>
}) {
  const sp = await searchParams
  const tab = (sp.tab === 'text' || sp.tab === 'audio' ? sp.tab : 'all') as Tab
  const hasAudio = tab === 'audio' ? true : tab === 'text' ? false : undefined

  const [result, categories, authors] = await Promise.all([
    getMasails({
      search: sp.q,
      categoryId: sp.category,
      authorId: sp.author,
      page: Number(sp.page ?? 1),
      hasAudio,
    }),
    getMasailCategories(),
    getMasailAuthors(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">মাসাইল</h1>
          <p className="text-sm text-muted-foreground">Islamic Rulings & Fatawa</p>
        </div>
      </div>

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
