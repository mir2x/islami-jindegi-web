import type { Metadata } from 'next'
import { Mic } from 'lucide-react'
import { getBayans, getBayanCategories, getBayanAuthors } from '@/lib/public-api'
import { BayanClient } from '@/components/public/bayan/bayan-client'

export const metadata: Metadata = {
  title: 'বয়ান | ইসলামী যিন্দেগী',
  description: 'বিভিন্ন আলেম ও বক্তার ইসলাহী বয়ান শুনুন',
}

export default async function BayanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; author?: string; page?: string }>
}) {
  const sp = await searchParams

  const [bayansResult, categories, authors] = await Promise.all([
    getBayans({
      search: sp.q,
      categoryId: sp.category,
      authorId: sp.author,
      page: Number(sp.page ?? 1),
    }),
    getBayanCategories(),
    getBayanAuthors(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">বয়ান</h1>
          <p className="text-sm text-muted-foreground">Islamic Sermons & Lectures</p>
        </div>
      </div>

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
