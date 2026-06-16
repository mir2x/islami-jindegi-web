import type { Metadata } from 'next'
import { Heart } from 'lucide-react'
import { getDuas, getDuaCategories } from '@/lib/public-api'
import { DuaClient } from '@/components/public/dua/dua-client'

export const metadata: Metadata = {
  title: "দু'আ-দুরূদ | ইসলামী যিন্দেগী",
  description: "ইসলামী দু'আ, দুরূদ ও আমলের সংগ্রহ",
}

type Tab = 'all' | 'text' | 'audio'

export default async function DuaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string; tab?: string }>
}) {
  const sp = await searchParams
  const tab = (sp.tab === 'text' || sp.tab === 'audio' ? sp.tab : 'all') as Tab
  const hasAudio = tab === 'audio' ? true : tab === 'text' ? false : undefined

  const [result, categories] = await Promise.all([
    getDuas({
      search: sp.q,
      categoryId: sp.category,
      page: Number(sp.page ?? 1),
      hasAudio,
    }),
    getDuaCategories(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Heart className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">দু'আ-দুরূদ</h1>
          <p className="text-sm text-muted-foreground">Supplications & Salawat</p>
        </div>
      </div>

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
