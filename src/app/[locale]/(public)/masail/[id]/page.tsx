import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, User, Tag, Calendar } from 'lucide-react'
import { getMasail, getMasails } from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const { id, locale } = await params
  const item = await getMasail(id)
  if (!item) return {}
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    title: `${item.title} | ${tMeta('title')}`,
  }
}

export default async function MasailDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params
  const item = await getMasail(id)
  if (!item) notFound()

  const related = await getMasails({ authorId: item.author?.id ?? undefined, pageSize: 6 })
  const more = (related?.data ?? []).filter(m => m.id !== item.id).slice(0, 5)

  const date = item.publishedAt ?? item.createdAt
  const t = await getTranslations({ locale, namespace: 'MasailDetail' })
  const tMasail = await getTranslations({ locale, namespace: 'MasailPage' })
  const tNav = await getTranslations({ locale, namespace: 'Nav' })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/masail" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> {tNav('masail')}
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

          {/* Audio */}
          {item.audioUrl && (
            <div className="mb-6 p-4 bg-muted/40 rounded-2xl">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">{t('audioLabel')}</p>
              <audio controls className="w-full" src={item.audioUrl} />
            </div>
          )}

          {/* Question */}
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-4 mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{tMasail('question')}</p>
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: item.question }} />
          </div>

          {/* Answer */}
          {item.answer && (
            <div className="rounded-lg bg-muted/50 border border-border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{tMasail('answer')}</p>
              <div className="prose-content" dangerouslySetInnerHTML={{ __html: item.answer }} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        {more.length > 0 && (
          <aside>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('moreItems')}</h2>
            <div className="space-y-0.5">
              {more.map(m => (
                <Link
                  key={m.id}
                  href={`/masail/${m.id}`}
                  className="block px-3 py-3 rounded-xl hover:bg-muted/60 transition-colors"
                >
                  <p className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">{m.title}</p>
                  {m.author && <p className="text-xs text-muted-foreground mt-0.5">{m.author.name}</p>}
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
