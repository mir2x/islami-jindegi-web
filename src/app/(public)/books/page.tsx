import type { Metadata } from 'next'
import { BookOpen } from 'lucide-react'
import { getBooks, getBookCategories, getBookAuthors } from '@/lib/public-api'
import { BooksClient } from '@/components/public/books/books-client'

export const metadata: Metadata = {
  title: 'কিতাব | ইসলামী যিন্দেগী',
  description: 'ইসলামী কিতাব ও পুস্তকের সংগ্রহ',
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; author?: string; page?: string }>
}) {
  const sp = await searchParams

  const [booksResult, categories, authors] = await Promise.all([
    getBooks({
      search: sp.q,
      categoryId: sp.category,
      authorId: sp.author,
      page: Number(sp.page ?? 1),
    }),
    getBookCategories(),
    getBookAuthors(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">কিতাব</h1>
          <p className="text-sm text-muted-foreground">Islamic Books & Literature</p>
        </div>
      </div>

      <BooksClient
        initialBooks={booksResult?.data ?? []}
        initialTotal={booksResult?.total ?? 0}
        categories={categories}
        authors={authors}
        initialSearch={sp.q ?? ''}
        initialCategory={sp.category ?? ''}
        initialAuthor={sp.author ?? ''}
      />
    </div>
  )
}
