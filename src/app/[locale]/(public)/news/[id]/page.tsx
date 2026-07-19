import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import { getNewsItem, getNewsList } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const item = await getNewsItem(id)
  if (!item) return {}
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    title: `${item.title} | ${tMeta('title')}`,
    description: item.excerpt ?? undefined,
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  const item = await getNewsItem(id)
  if (!item) notFound()

  const related = await getNewsList({ pageSize: 6 })
  const more = (related?.data ?? []).filter(n => n.id !== item.id).slice(0, 5)

  const date = item.publishedAt ?? item.createdAt
  const t = await getTranslations({ locale, namespace: 'NewsDetail' })
  const tNav = await getTranslations({ locale, namespace: 'Nav' })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/news" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> {tNav('news')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-foreground leading-snug mb-4">{item.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border/50">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
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
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('moreNews')}</h2>
            <div className="space-y-0.5">
              {more.map(n => (
                <Link
                  key={n.id}
                  href={`/news/${n.id}`}
                  className="block px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
