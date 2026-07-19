import { ArticlesClient } from '@/components/public/articles/articles-client'
import { getArticles, getArticleAuthors, getArticleCategories } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ArticlesPage' })
  return { title: t('metaTitle') }
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const search = sp.q ?? ''
  const categoryId = sp.category ?? ''
  const authorId = sp.author ?? ''

  const [result, authors, categories] = await Promise.all([
    getArticles({ search: search || undefined, categoryId: categoryId || undefined, authorId: authorId || undefined, page: 1 }),
    getArticleAuthors(),
    getArticleCategories(),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:h-[calc(100vh-68px)] lg:flex lg:flex-col">
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
