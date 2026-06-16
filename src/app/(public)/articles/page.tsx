import { ArticlesClient } from '@/components/public/articles/articles-client'
import { getArticles, getArticleAuthors, getArticleCategories } from '@/lib/public-api'

export const metadata = { title: 'প্রবন্ধ' }

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const search = sp.q ?? ''
  const categoryId = sp.category ?? ''
  const authorId = sp.author ?? ''
  const page = Number(sp.page ?? 1)

  const [result, authors, categories] = await Promise.all([
    getArticles({ search: search || undefined, categoryId: categoryId || undefined, authorId: authorId || undefined, page }),
    getArticleAuthors(),
    getArticleCategories(),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">প্রবন্ধ</h1>
        <p className="text-muted-foreground text-sm mt-1">ইসলামি প্রবন্ধ ও নিবন্ধ সংকলন</p>
      </div>
      <ArticlesClient
        initialItems={result?.data ?? []}
        initialTotal={result?.total ?? 0}
        authors={authors}
        categories={categories}
        initialSearch={search}
        initialCategory={categoryId}
        initialAuthor={authorId}
      />
    </div>
  )
}
