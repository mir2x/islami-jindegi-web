import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, User, Tag, Calendar } from 'lucide-react'
import { getArticle, getArticles } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const item = await getArticle(id)
  if (!item) return {}
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    title: `${item.title} | ${tMeta('title')}`,
    description: item.excerpt ?? undefined,
  }
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  const item = await getArticle(id)
  if (!item) notFound()

  const related = await getArticles({ authorId: item.author?.id, pageSize: 6 })
  const more = (related?.data ?? []).filter(a => a.id !== item.id).slice(0, 5)

  const date = item.publishedAt ?? item.createdAt
  const t = await getTranslations({ locale, namespace: 'ArticleDetail' })
  const tNav = await getTranslations({ locale, namespace: 'Nav' })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> {tNav('articles')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-foreground leading-snug mb-4">{item.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/50">
            {item.author && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {item.author.name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {item.categories.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                {item.categories.map(c => c.title).join(', ')}
              </span>
            )}
          </div>

          {/* Body */}
          {item.body ? (
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: item.body }} />
          ) : item.excerpt ? (
            <p className="text-base text-foreground/80 leading-relaxed">{item.excerpt}</p>
          ) : null}
        </div>

        {/* Sidebar */}
        {more.length > 0 && (
          <aside>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('moreArticles')}</h2>
            <div className="space-y-0.5">
              {more.map(a => (
                <Link
                  key={a.id}
                  href={`/articles/${a.id}`}
                  className="block px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">{a.title}</p>
                  {a.author && <p className="text-xs text-muted-foreground mt-0.5">{a.author.name}</p>}
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
