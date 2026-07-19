import { getBooks, getBookCategories, getBookAuthors } from '@/lib/public-api'
import { BooksClient } from '@/components/public/books/books-client'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'BooksPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
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
