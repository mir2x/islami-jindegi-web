import type { Metadata } from 'next'
import { getBooks, getBookCategories, getBookAuthors } from '@/lib/public-api'
import { BooksClient } from '@/components/public/books/books-client'

export const metadata: Metadata = {
  title: 'কিতাব | ইসলামী যিন্দেগী',
  description: 'ইসলামী কিতাব ও পুস্তকের সংগ্রহ',
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; author?: string }>
}) {
  const sp = await searchParams

  const [booksResult, categories, authors] = await Promise.all([
    getBooks({
      search: sp.q,
      categoryId: sp.category,
      authorId: sp.author,
      page: 1,
    }),
    getBookCategories(),
    getBookAuthors(),
  ])

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 lg:h-[calc(100vh-68px)] lg:flex lg:flex-col">
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
